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

// ---------------- Per-member karma cycles ----------------
// Each member has their own 12-month karma cycle that starts on their sign-up
// date and renews on every anniversary, keeping up to `carryover_max` points.

export type UserCycle = {
  id: string;
  cycleIndex: number;
  startsAt: string;
  endsAt: string;
  carryoverIn: number;
};

export async function karmaCarryoverMax(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("karma_settings")
    .select("carryover_max")
    .eq("id", true)
    .maybeSingle();
  return data?.carryover_max ?? 30;
}

function addYears(iso: string, years: number): Date {
  const d = new Date(iso);
  const next = new Date(d.getTime());
  next.setFullYear(next.getFullYear() + years);
  return next;
}

/** Cycle window boundaries for a given signup date and cycle index (1-based). */
function windowFor(signupIso: string, index: number): { startsAt: Date; endsAt: Date } {
  return { startsAt: addYears(signupIso, index - 1), endsAt: addYears(signupIso, index) };
}

async function rawBalanceInWindow(userId: string, startsAt: string, endsAt: string): Promise<number> {
  const [{ data: entries }, { data: reds }] = await Promise.all([
    supabaseAdmin
      .from("karma_entries")
      .select("points")
      .eq("user_id", userId)
      .eq("status", "approved")
      .gte("created_at", startsAt)
      .lt("created_at", endsAt),
    supabaseAdmin
      .from("karma_redemptions")
      .select("points_spent")
      .eq("user_id", userId)
      .neq("status", "rejected")
      .gte("created_at", startsAt)
      .lt("created_at", endsAt),
  ]);
  const earned = (entries ?? []).reduce((sum, e) => sum + (e.points ?? 0), 0);
  const spent = (reds ?? []).reduce((sum, r) => sum + (r.points_spent ?? 0), 0);
  return earned - spent;
}

/**
 * Returns the member's current karma cycle, closing and rolling over any
 * expired cycles (keeping at most the configured carryover) on the way.
 */
export async function ensureUserCycle(userId: string): Promise<UserCycle> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  const signupIso = profile?.created_at ?? new Date().toISOString();

  const now = Date.now();
  let currentIndex = 1;
  while (windowFor(signupIso, currentIndex).endsAt.getTime() <= now) currentIndex += 1;

  const { data: rows } = await supabaseAdmin
    .from("karma_user_cycles")
    .select("id, cycle_index, starts_at, ends_at, carryover_in, closed_at")
    .eq("user_id", userId)
    .order("cycle_index", { ascending: true });
  const existing = new Map((rows ?? []).map((r) => [r.cycle_index, r]));

  const carryoverMax = await karmaCarryoverMax();
  let carryover = 0;

  for (let index = 1; index <= currentIndex; index += 1) {
    const { startsAt, endsAt } = windowFor(signupIso, index);
    let row = existing.get(index);
    if (!row) {
      const { data: inserted } = await supabaseAdmin
        .from("karma_user_cycles")
        .insert({
          user_id: userId,
          cycle_index: index,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          carryover_in: carryover,
        })
        .select("id, cycle_index, starts_at, ends_at, carryover_in, closed_at")
        .single();
      if (!inserted) throw new Error("No se ha podido crear el ciclo de karma");
      row = inserted;
    }

    if (index === currentIndex) {
      return {
        id: row.id,
        cycleIndex: row.cycle_index,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        carryoverIn: row.carryover_in ?? 0,
      };
    }

    // Past cycle: close it (if needed) and compute what rolls over.
    const closingBalance =
      (row.carryover_in ?? 0) + (await rawBalanceInWindow(userId, row.starts_at, row.ends_at));
    if (!row.closed_at) {
      await supabaseAdmin
        .from("karma_user_cycles")
        .update({ closed_at: new Date().toISOString(), points_at_close: closingBalance })
        .eq("id", row.id);
    }
    carryover = Math.max(0, Math.min(closingBalance, carryoverMax));
  }

  throw new Error("No se ha podido determinar el ciclo de karma");
}

export async function karmaBalance(userId: string): Promise<number> {
  const cycle = await ensureUserCycle(userId);
  return cycle.carryoverIn + (await rawBalanceInWindow(userId, cycle.startsAt, cycle.endsAt));
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
