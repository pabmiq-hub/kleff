import { aiText } from "@/lib/ai.server";
import { svgDataUri } from "./item-art";
import { MAP_ART_SYSTEM, MAP_VIEWBOX, SCENE_ART_SYSTEM, SCENE_VIEWBOX, fallbackMapSvg, featureArtPrompt, mapArtPrompt, roomArtPrompt, validateArtSvg } from "./map-art";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Asks Gemini up to 3 times, re-sending the rejection reason; returns a data URI or null. */
async function drawSvg(system: string, user: string, viewBox: string, minShapes: number): Promise<string | null> {
  let prompt = user;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(800 * attempt);
    const out = await aiText({ tag: "[mm-map-art]", system, user: prompt }).catch(() => null);
    const check = validateArtSvg(out, { viewBox, minShapes });
    if (check.ok) return svgDataUri(check.svg);
    prompt = `${user}\n\nYour previous answer was rejected: ${check.reason} Fix it and answer again with one valid SVG.`;
  }
  return null;
}

/**
 * Fills the castle plan, room and feature drawings that are missing (or all with `force`).
 * The plan always ends up with at least the server-side fallback, so pins always line up. Never throws.
 */
export async function fillGameMapArt(db: () => any, gameId: string, opts: { force?: boolean } = {}): Promise<{ generated: number; failed: number; fallback: boolean }> {
  const [{ data: game }, { data: locs }, { data: feats }] = await Promise.all([
    db().from("mm_games").select("id, title, synopsis, map_url").eq("id", gameId).single(),
    db().from("mm_locations").select("*").eq("game_id", gameId).order("sort_order"),
    db().from("mm_location_features").select("*").eq("game_id", gameId).order("sort_order"),
  ]);
  const locations = (locs ?? []) as any[];
  const features = (feats ?? []) as any[];
  let generated = 0;
  let failed = 0;
  let fallback = false;
  if (!game || !locations.length) return { generated, failed, fallback };
  const pts = locations.map((l) => ({ name: l.name, description: l.description, x: Number(l.x), y: Number(l.y) }));

  if (opts.force || !game.map_url) {
    const url = await drawSvg(MAP_ART_SYSTEM, mapArtPrompt(game, pts), MAP_VIEWBOX, Math.max(6, 2 * locations.length));
    if (url) generated++;
    else {
      failed++;
      fallback = true;
    }
    await db().from("mm_games").update({ map_url: url ?? svgDataUri(fallbackMapSvg(pts)) }).eq("id", gameId);
  }

  type Job = { table: string; id: string; run: () => Promise<string | null> };
  const jobs: Job[] = [];
  for (const l of locations) {
    if (opts.force || !l.image_url) {
      const names = features.filter((f) => f.location_id === l.id).map((f) => f.name);
      jobs.push({ table: "mm_locations", id: l.id, run: () => drawSvg(SCENE_ART_SYSTEM, roomArtPrompt(game, l, names), SCENE_VIEWBOX, 4) });
    }
  }
  for (const f of features) {
    if (opts.force || !f.image_url) {
      const room = locations.find((l) => l.id === f.location_id) ?? { name: "" };
      jobs.push({ table: "mm_location_features", id: f.id, run: () => drawSvg(SCENE_ART_SYSTEM, featureArtPrompt(game, room, f), SCENE_VIEWBOX, 4) });
    }
  }
  // Small batches so Gemini's concurrency quota doesn't cut drawings off.
  for (let i = 0; i < jobs.length; i += 2) {
    if (i) await sleep(600);
    await Promise.all(
      jobs.slice(i, i + 2).map(async (j) => {
        try {
          const url = await j.run();
          if (!url) return void failed++;
          const { error } = await db().from(j.table).update({ image_url: url }).eq("id", j.id);
          if (error) failed++;
          else generated++;
        } catch {
          failed++;
        }
      }),
    );
  }
  return { generated, failed, fallback };
}
