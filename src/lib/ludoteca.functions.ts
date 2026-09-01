import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  );
}

const SELECT_FIELDS =
  "id, bgg_id, title, image_url, thumbnail_url, year_published, min_players, max_players, min_playtime, max_playtime, duration_minutes, min_age, bgg_rating, bgg_rating_users, bgg_weight, bgg_weight_users, bgg_rank, bgg_type, categories, mechanics, bgg_url, is_active, last_synced_at, total_copies, shelf, shape, slot_number, drawer_number, drawer_letter, shelf_color, in_drawer";


export const listLudoteca = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("bgg_games")
      .select(SELECT_FIELDS)
      .eq("is_active", true)
      .order("bgg_rating", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return { games: data ?? [], syncedAt: data?.[0]?.last_synced_at ?? null };
  },
);

/** Recomienda juegos similares por mecánicas/categorías/peso/duración. */
export const recommendSimilar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ gameId: z.string().uuid(), limit: z.number().int().min(1).max(20).default(6) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: target, error: tErr } = await supabase
      .from("bgg_games")
      .select("id, mechanics, categories, bgg_weight, duration_minutes, max_playtime")
      .eq("id", data.gameId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!target) throw new Error("Juego no encontrado");

    const { data: pool, error: pErr } = await supabase
      .from("bgg_games")
      .select(SELECT_FIELDS)
      .eq("is_active", true)
      .neq("id", data.gameId);
    if (pErr) throw new Error(pErr.message);

    const tMech = new Set<string>((target.mechanics ?? []) as string[]);
    const tCat = new Set<string>((target.categories ?? []) as string[]);
    const tWeight = (target.bgg_weight as number | null) ?? null;
    const tDur = ((target.duration_minutes ?? target.max_playtime) as number | null) ?? null;

    function jaccard(a: Set<string>, b: string[]): number {
      if (a.size === 0 && b.length === 0) return 0;
      const setB = new Set(b);
      let inter = 0;
      for (const x of a) if (setB.has(x)) inter++;
      const union = a.size + setB.size - inter;
      return union === 0 ? 0 : inter / union;
    }

    const scored = (pool ?? [])
      .map((g) => {
        const mech = jaccard(tMech, (g.mechanics ?? []) as string[]);
        const cat = jaccard(tCat, (g.categories ?? []) as string[]);
        const wDiff = tWeight != null && g.bgg_weight != null ? 1 - Math.min(Math.abs(tWeight - (g.bgg_weight as number)) / 4, 1) : 0;
        const gDur = (g.duration_minutes ?? g.max_playtime) as number | null;
        const dDiff = tDur != null && gDur != null ? 1 - Math.min(Math.abs(tDur - gDur) / 120, 1) : 0;
        const score = 0.45 * mech + 0.35 * cat + 0.12 * wDiff + 0.08 * dDiff;
        const sharedMech = (g.mechanics ?? []).filter((m: string) => tMech.has(m)).slice(0, 3);
        const sharedCat = (g.categories ?? []).filter((c: string) => tCat.has(c)).slice(0, 2);
        return { game: g, score, shared: [...sharedMech, ...sharedCat] };
      })
      .filter((x) => x.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, data.limit);

    return { results: scored };
  });
