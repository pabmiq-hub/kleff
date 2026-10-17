import { z } from "zod";

// Stored on the game; never expose this collection without filtering it first.
export const readingSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const r = value as Record<string, unknown>;
  return { ...r, reader: r.reader ?? r.character ?? "host", text: r.text ?? r.content };
}, z.object({
  act: z.enum(["intro", "investigation", "conclusion"]),
  reader: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  trigger: z.enum(["act_start", "murder", "final_reveal"]).optional(),
}).transform((r) => ({ ...r, trigger: r.trigger ?? (r.act === "conclusion" ? "final_reveal" : "act_start") })));

export type MMReading = z.infer<typeof readingSchema>;

export function playerReadings(readings: MMReading[], session: {
  status: string; characters_released_at?: string | null; murder_triggered_at?: string | null;
  revealed_at?: string | null; act?: { key: string } | null;
}, characterRef: string | null) {
  if (!characterRef || !session.characters_released_at || session.status === "lobby") return [];
  return readings.filter((r) => {
    if (r.reader !== characterRef) return false;
    if (r.trigger === "final_reveal") return session.status === "finished" && !!session.revealed_at;
    if (session.status === "finished" || r.act !== session.act?.key) return false;
    return r.trigger !== "murder" || !!session.murder_triggered_at;
  });
}