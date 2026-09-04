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

/** Normalizes free text into a URL-safe slug. */
export function slugifyEventName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
