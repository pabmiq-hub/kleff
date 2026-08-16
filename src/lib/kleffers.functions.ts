import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * List active KLEFF members visible to other members.
 * Returns only public fields: username, avatar, ludoya link.
 * Uses supabaseAdmin (bypasses RLS) but projects only safe columns.
 */
export const listKleffers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, avatar_url, ludoya_username, ludoya_display_name, ludoya_avatar_url, member_number, created_at",
      )
      .order("member_number", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: extended } = await supabaseAdmin
      .from("member_profiles")
      .select(
        "user_id, attends_alone, goals, favorite_games, game_types, availability, experience_level, bio, languages, teaches, scheduled_games",
      )
      .eq("is_public", true);

    const byUser = new Map((extended ?? []).map((e) => [e.user_id, e]));
    const kleffers = (data ?? []).map((k) => ({ ...k, extended: byUser.get(k.id) ?? null }));
    return { kleffers };
  });

/** Ficha ampliada de un kleffer, con su perfil de Ludoya si lo tiene vinculado. */
export const getKlefferProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, avatar_url, member_number, created_at, ludoya_username, ludoya_display_name, ludoya_avatar_url",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return { profile: null, ludoya: null, extended: null };

    const { data: extended } = await supabaseAdmin
      .from("member_profiles")
      .select("*")
      .eq("user_id", data.id)
      .eq("is_public", true)
      .maybeSingle();

    let ludoya = null;
    if (profile.ludoya_username) {
      try {
        const { getLudoyaMember } = await import("@/lib/ludoya.server");
        ludoya = await getLudoyaMember(profile.ludoya_username);
      } catch {
        ludoya = null;
      }
    }
    return { profile, ludoya, extended: extended ?? null };
  });

