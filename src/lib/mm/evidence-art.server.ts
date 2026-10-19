import { aiText } from "@/lib/ai.server";
import { sanitizeSvg, svgDataUri } from "./item-art";
import { EVIDENCE_ART_SYSTEM, evidenceArtPrompt } from "./evidence-art";

/** Generates a tangible SVG illustration for one evidence; returns a data URI or null. */
export async function generateEvidenceArt(e: { title: string; content?: string | null; reveal_style?: string | null; scope?: string | null }): Promise<string | null> {
  const { user } = evidenceArtPrompt(e);
  const out = await aiText({ tag: "[mm-evidence-art]", system: EVIDENCE_ART_SYSTEM, user });
  const svg = sanitizeSvg(out);
  return svg ? svgDataUri(svg) : null;
}

/**
 * Fills image_url for every evidence of a game that lacks one (or all of them with `force`).
 * Evidences that already ship an image in the imported JSON are never overwritten unless forced. Never throws.
 */
export async function fillGameEvidenceArt(db: () => any, gameId: string, opts: { force?: boolean } = {}): Promise<{ generated: number; failed: number }> {
  const { data: evidences } = await db().from("mm_evidences").select("id, title, content, scope, reveal_style, image_url").eq("game_id", gameId);
  const todo = (evidences ?? []).filter((e: any) => opts.force || !e.image_url);
  let generated = 0;
  let failed = 0;
  // Evidences with the same title and text (a personal clue duplicated for two players) share one illustration.
  const cache = new Map<string, Promise<string | null>>();
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(
      todo.slice(i, i + 4).map(async (e: any) => {
        try {
          const key = `${e.title}|${e.content ?? ""}`;
          if (!cache.has(key)) cache.set(key, generateEvidenceArt(e).catch(() => null));
          const url = await cache.get(key);
          if (!url) return void failed++;
          const { error } = await db().from("mm_evidences").update({ image_url: url }).eq("id", e.id);
          if (error) failed++;
          else generated++;
        } catch {
          failed++;
        }
      }),
    );
  }
  return { generated, failed };
}
