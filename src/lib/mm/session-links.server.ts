import { editSessionSlugSchema, sessionSlugSchema } from "./session-links";
type DB = () => any;

export async function resolveSessionSlug(db: DB, value: string): Promise<string | null> {
  const parsed = sessionSlugSchema.safeParse(value);
  if (!parsed.success) return null;
  const { data, error } = await db().from("mm_sessions").select("id").eq("join_slug", parsed.data).maybeSingle();
  if (error) throw new Error("No se ha podido abrir el enlace de la partida. Inténtalo de nuevo.");
  return data?.id ?? null;
}
export async function updateSessionSlug(db: DB, input: { sessionId: string; slug: string }) {
  const { sessionId, slug } = editSessionSlugSchema.parse(input);
  const { data, error } = await db().from("mm_sessions").update({ join_slug: slug }).eq("id", sessionId).select("id,join_slug").maybeSingle();
  if (error?.code === "23505") throw new Error("Este enlace ya lo usa otra partida. Elige otro.");
  if (error) throw new Error("No se ha podido guardar el enlace de la partida.");
  if (!data) throw new Error("Partida no encontrada.");
  return { slug: data.join_slug as string };
}