import { z } from "zod";

export function normalizeSessionSlug(value: string): string {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

export const sessionSlugSchema = z.string().transform(normalizeSessionSlug).pipe(
  z.string().min(3, "Usa al menos 3 caracteres.").max(48, "Usa como máximo 48 caracteres.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa letras, números y guiones, sin guiones al principio ni al final."),
);
export const editSessionSlugSchema = z.object({ sessionId: z.string().uuid(), slug: sessionSlugSchema });
export function sessionJoinPath(sessionId: string, slug?: string | null): string {
  return slug ? `/j/${encodeURIComponent(slug)}` : `/actividades/juegos/unirse/${sessionId}`;
}