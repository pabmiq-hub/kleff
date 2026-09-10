// Public participant URLs. Events expose a friendly slug (kleff.es/mi-evento)
// and fall back to the event id when no slug has been set yet.

export type PublicEventLink = "join" | "checkin" | "tables" | "access" | "select" | "cancel";

const SEGMENTS: Record<PublicEventLink, string> = {
  join: "",
  checkin: "check-in",
  tables: "mesas",
  access: "usuario",
  select: "seleccion",
  cancel: "cancelar",
};

export function eventPublicPath(
  slugOrId: string,
  kind: PublicEventLink,
  extra?: string,
): string {
  const parts = [slugOrId, SEGMENTS[kind], extra].filter(Boolean);
  return `/${parts.join("/")}`;
}

export function eventPublicUrl(slugOrId: string, kind: PublicEventLink, extra?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${eventPublicPath(slugOrId, kind, extra)}`;
}

/** Normalizes free text (or a pasted full URL) into a URL-safe slug. */
export function slugifyEventName(value: string): string {
  return normalizeSlug(value).replace(/^-+|-+$/g, "");
}

/**
 * Same as slugifyEventName but keeps a trailing hyphen so the user can type
 * multi-word slugs (e.g. "sfm-ludico") without the separator disappearing.
 */
export function slugifyEventDraft(value: string): string {
  return normalizeSlug(value).replace(/^-+/, "");
}

function normalizeSlug(value: string): string {
  let raw = value.trim();
  // Accept pasted URLs like https://kleff.es/mi-evento
  const urlMatch = raw.match(/^(?:https?:\/\/)?[^/\s]*\.[^/\s]+\/(.+)$/i);
  if (urlMatch) raw = urlMatch[1];
  raw = raw.split("/").filter(Boolean)[0] ?? "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}


