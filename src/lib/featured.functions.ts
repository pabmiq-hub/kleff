import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin role required");
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const GAME_FIELDS =
  "id, game_id, start_date, end_date, notified_at, created_at, " +
  "bgg_games(id, bgg_id, title, image_url, thumbnail_url, year_published, min_players, max_players, min_playtime, max_playtime, duration_minutes, min_age, bgg_rating, bgg_weight, categories, bgg_url, shelf, shape, slot_number, drawer_number, drawer_letter, shelf_color)";

function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function dispatchNotificationsIfDue(id: string) {
  const { data: row } = await supabaseAdmin
    .from("featured_games")
    .select("id, game_id, start_date, end_date, notified_at, bgg_games(title)")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.notified_at) return;
  const today = new Date().toISOString().slice(0, 10);
  if (row.start_date > today) return;

  const { data: users } = await supabaseAdmin.from("profiles").select("id");
  const title = "Nuevo juego destacado";
  const gameTitle = (row.bgg_games as { title?: string } | null)?.title ?? "un juego";
  const body = `“${gameTitle}” es un juego destacado del ${formatDateEs(row.start_date)} al ${formatDateEs(row.end_date)}. ¿Te apetece jugarlo?`;
  const rows = (users ?? []).map((u) => ({
    user_id: u.id,
    type: "featured_game",
    title,
    body,
    url: "/app",
  }));
  if (rows.length) {
    await supabaseAdmin.from("notifications").insert(rows);
  }
  await supabaseAdmin
    .from("featured_games")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", id);
}

export const listFeaturedGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("featured_games")
      .select(GAME_FIELDS)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return { featured: data ?? [] };
  });

export const listCurrentFeaturedGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("featured_games")
      .select(GAME_FIELDS)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return { featured: data ?? [] };
  });

export const createFeaturedGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        gameId: z.string().uuid(),
        startDate: dateSchema,
        endDate: dateSchema,
      })
      .refine((v) => v.endDate >= v.startDate, {
        message: "La fecha final debe ser igual o posterior a la inicial",
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("featured_games")
      .insert({
        game_id: data.gameId,
        start_date: data.startDate,
        end_date: data.endDate,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await dispatchNotificationsIfDue(row.id);
    return { success: true, id: row.id };
  });

export const deleteFeaturedGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("featured_games").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const dispatchDueFeaturedNotifications = createServerFn({ method: "POST" }).handler(
  async () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: due } = await supabaseAdmin
      .from("featured_games")
      .select("id")
      .lte("start_date", today)
      .gte("end_date", today)
      .is("notified_at", null);
    for (const r of due ?? []) {
      await dispatchNotificationsIfDue(r.id);
    }
    return { processed: due?.length ?? 0 };
  },
);
