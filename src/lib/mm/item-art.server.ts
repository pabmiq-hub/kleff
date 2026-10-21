import { aiText } from "@/lib/ai.server";
import { itemCategory, sanitizeSvg, svgDataUri } from "./item-art";

const SYSTEM = `You are an illustrator producing flat cartoon icons that match the DiceBear "Avataaars" avatar style:
bold clean shapes, flat fills, soft pastel/saturated palette, 2-3px dark outline (#262E33), subtle single-tone shading, no gradients except optional one soft highlight, no text, no letters.
Return ONLY one SVG element: viewBox="0 0 128 128", width="128" height="128", centered object on a soft circular background (#F3EBDD), at most ~40 shapes.
Never use <script>, <image>, <foreignObject>, external links, fonts or event attributes.`;

/** Generates an Avataaars-style SVG for one item; returns a data URI or null. */
export async function generateItemArt(item: { name: string; description?: string | null; type?: string | null }): Promise<string | null> {
  const cat = itemCategory(item);
  const out = await aiText({
    tag: "[mm-item-art]",
    system: SYSTEM,
    user: `Object: ${item.name}\nCategory: ${cat}\nContext (murder mystery game prop): ${(item.description ?? "").slice(0, 400)}\nDraw only the object.`,
  });
  const svg = sanitizeSvg(out);
  return svg ? svgDataUri(svg) : null;
}

/** Fills image_url for every item of a game that lacks one. Never throws. */
export async function fillGameItemArt(db: () => any, gameId: string): Promise<{ generated: number; failed: number }> {
  const { data: chars } = await db().from("mm_characters").select("id").eq("game_id", gameId);
  const ids = (chars ?? []).map((c: any) => c.id);
  if (!ids.length) return { generated: 0, failed: 0 };
  const { data: items } = await db().from("mm_items").select("id, name, description, type, image_url").in("character_id", ids);
  const todo = (items ?? []).filter((i: any) => !i.image_url);
  let generated = 0;
  let failed = 0;
  // Small batches with a pause (and one retry) so Gemini's concurrency quota doesn't cut items off.
  const attempt = async (it: any) => (await generateItemArt(it).catch(() => null)) ?? (await new Promise((r) => setTimeout(r, 1500)), generateItemArt(it).catch(() => null));
  for (let i = 0; i < todo.length; i += 2) {
    if (i > 0) await new Promise((r) => setTimeout(r, 800));
    await Promise.all(
      todo.slice(i, i + 2).map(async (it: any) => {
        try {
          const url = await attempt(it);
          if (!url) return void failed++;
          const { error } = await db().from("mm_items").update({ image_url: url }).eq("id", it.id);
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
