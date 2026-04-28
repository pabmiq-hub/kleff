import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// Public-facing ludoteca listing. Uses the anon key (RLS already allows
// public SELECT on bgg_games where is_active = true). Kept in its own file
// so it does NOT import the admin client — that would leak the service role
// key into the client bundle via LudotecaPage.tsx.
export const listLudoteca = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    );
    const { data, error } = await supabase
      .from("bgg_games")
      .select(
        "id, bgg_id, title, image_url, thumbnail_url, year_published, min_players, max_players, min_playtime, max_playtime, duration_minutes, min_age, bgg_rating, bgg_rating_users, bgg_weight, bgg_weight_users, bgg_rank, bgg_type, categories, mechanics, bgg_url, is_active, last_synced_at",
      )
      .eq("is_active", true)
      .order("bgg_rating", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return { games: data ?? [], syncedAt: data?.[0]?.last_synced_at ?? null };
  },
);
