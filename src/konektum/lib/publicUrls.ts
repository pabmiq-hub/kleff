// Public participant URLs. Events expose a friendly slug (kleff.es/mi-evento/registro)
// and fall back to the event id when no slug has been set yet.

export type PublicEventLink = "join" | "checkin" | "tables" | "access" | "select" | "cancel";

const SEGMENTS: Record<PublicEventLink, string> = {
  join: "registro",
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
  const suffix = extra ? `/${extra}` : "";
  return `/${slugOrId}/${SEGMENTS[kind]}${suffix}`;
}

export function eventPublicUrl(slugOrId: string, kind: PublicEventLink, extra?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${eventPublicPath(slugOrId, kind, extra)}`;
}

/** Normalizes free text (or a pasted full URL) into a URL-safe slug. */
export function slugifyEventName(value: string): string {
  let raw = value.trim();
  // Accept pasted URLs like https://kleff.es/mi-evento/registro
  const urlMatch = raw.match(/^(?:https?:\/\/)?[^/\s]*\.[^/\s]+\/(.+)$/i);
  if (urlMatch) raw = urlMatch[1];
  raw = raw.split("/").filter(Boolean)[0] ?? "";
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

