import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function activeSeasonId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("karma_seasons")
    .select("id")
    .eq("is_active", true)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function karmaBalance(userId: string): Promise<number> {
  const seasonId = await activeSeasonId();
  const { data: entries } = await supabaseAdmin
    .from("karma_entries")
    .select("points, season_id")
    .eq("user_id", userId)
    .eq("status", "approved");
  const earned = (entries ?? [])
    .filter((e) => !seasonId || e.season_id === seasonId || e.season_id === null)
    .reduce((sum, e) => sum + (e.points ?? 0), 0);

  const { data: reds } = await supabaseAdmin
    .from("karma_redemptions")
    .select("points_spent, status")
    .eq("user_id", userId)
    .neq("status", "rejected");
  const spent = (reds ?? []).reduce((sum, r) => sum + (r.points_spent ?? 0), 0);
  return earned - spent;
}

export async function karmaLifetime(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("karma_entries")
    .select("points")
    .eq("user_id", userId)
    .eq("status", "approved");
  return (data ?? []).reduce((sum, e) => sum + (e.points ?? 0), 0);
}

/** How many entries the user already has in the current limit window for a category. */
export async function categoryUsage(
  userId: string,
  categoryId: string,
  period: "none" | "weekly" | "monthly",
): Promise<number> {
  if (period === "none") return 0;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  if (period === "weekly") {
    const day = (since.getDay() + 6) % 7; // monday = 0
    since.setDate(since.getDate() - day);
  } else {
    since.setDate(1);
  }
  const { count } = await supabaseAdmin
    .from("karma_entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category_id", categoryId)
    .in("status", ["pending", "approved"])
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  url = "/app/karma",
): Promise<void> {
  try {
    await supabaseAdmin.from("notifications").insert({ user_id: userId, type, title, body, url });
  } catch (err) {
    console.warn("karma notification failed:", err instanceof Error ? err.message : err);
  }
}

/** Number of extra simultaneous rental perks currently active for a user. */
export async function activeExtraRentalPerks(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("karma_perks")
    .select("id, expires_at, consumed_at")
    .eq("user_id", userId)
    .eq("kind", "extra_rental")
    .is("consumed_at", null);
  const now = Date.now();
  return (data ?? []).filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > now).length;
}
