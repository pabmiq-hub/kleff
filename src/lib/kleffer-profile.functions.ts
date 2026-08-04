import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const favoriteGameSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(200),
  imageUrl: z.string().max(600).nullable().optional(),
});

const klefferSchema = z.object({
  attendsAlone: z.string().max(30).nullable(),
  scheduledGames: z.string().max(30).nullable(),
  goals: z.array(z.string().max(40)).max(12),
  favoriteGames: z.array(favoriteGameSchema).max(5),
  gameTypes: z.array(z.string().max(40)).max(20),
  experienceLevel: z.string().max(30).nullable(),
  availability: z.array(z.string().max(40)).max(20),
  languages: z.array(z.string().max(20)).max(10),
  teaches: z.string().max(30).nullable(),
  bio: z.string().max(200).nullable(),
  isPublic: z.boolean(),
});

export const getMyKlefferProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("member_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: data ?? null };
  });

export const updateMyKlefferProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => klefferSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("member_profiles").upsert(
      {
        user_id: context.userId,
        attends_alone: data.attendsAlone,
        scheduled_games: data.scheduledGames,
        goals: data.goals,
        favorite_games: data.favoriteGames,
        game_types: data.gameTypes,
        experience_level: data.experienceLevel,
        availability: data.availability,
        languages: data.languages,
        teaches: data.teaches,
        bio: data.bio,
        is_public: data.isPublic,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });
