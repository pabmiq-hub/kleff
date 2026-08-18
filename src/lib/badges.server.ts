import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { tierForProgress, type BadgeTier, type BadgeTierDef } from "@/lib/badges";

type BadgeRow = {
  id: string;
  code: string;
  kind: "tiered" | "unique";
  source: "ludoya" | "karma" | "manual";
  auto_metric: string | null;
  auto_param: string | null;
  tiers: unknown;
  name_es: string;
};

function parseTiers(raw: unknown): BadgeTierDef[] {
  return Array.isArray(raw) ? (raw as BadgeTierDef[]) : [];
}

async function metricValue(
  userId: string,
  metric: string,
  param: string | null,
): Promise<number> {
  switch (metric) {
    case "karma_group": {
      const { data: cats } = await supabaseAdmin
        .from("karma_categories")
        .select("id")
        .eq("grp", param as never);
      const ids = (cats ?? []).map((c) => c.id);
      if (!ids.length) return 0;
      const { count } = await supabaseAdmin
        .from("karma_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "approved")
        .in("category_id", ids);
      return count ?? 0;
    }
    case "rentals": {
      const { count } = await supabaseAdmin
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
    case "referrals": {
      const { count } = await supabaseAdmin
        .from("karma_referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", userId)
        .eq("signup_awarded", true);
      return count ?? 0;
    }
    case "polls": {
      const [{ count: responses }, { data: votes }] = await Promise.all([
        supabaseAdmin
          .from("poll_responses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabaseAdmin.from("poll_votes").select("poll_id").eq("user_id", userId),
      ]);
      const distinctVoted = new Set((votes ?? []).map((v) => v.poll_id)).size;
      return (responses ?? 0) + distinctVoted;
    }
    case "member_number": {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("member_number")
        .eq("id", userId)
        .maybeSingle();
      const max = Number(param ?? "0");
      return data && data.member_number <= max ? 1 : 0;
    }
    default:
      return 0;
  }
}

/**
 * Recompute automatable badge progress for a member, unlock new tiers and
 * notify. Manual badges are left untouched. Returns the badges unlocked now.
 */
export async function recomputeUserBadges(userId: string): Promise<string[]> {
  const { data: badges } = await supabaseAdmin
    .from("badges")
    .select("id, code, kind, source, auto_metric, auto_param, tiers, name_es")
    .eq("is_active", true);

  const { data: existing } = await supabaseAdmin
    .from("user_badges")
    .select("badge_id, progress, tier, unlocked_at")
    .eq("user_id", userId);
  const byBadge = new Map((existing ?? []).map((e) => [e.badge_id, e]));

  const newlyUnlocked: string[] = [];

  for (const b of (badges ?? []) as BadgeRow[]) {
    if (!b.auto_metric) continue;
    const progress = await metricValue(userId, b.auto_metric, b.auto_param);
    const tiers = parseTiers(b.tiers);
    const tier: BadgeTier | null =
      b.kind === "tiered" ? tierForProgress(tiers, progress) : null;
    const unlocked = b.kind === "tiered" ? !!tier : progress > 0;
    const prev = byBadge.get(b.id);
    const wasUnlocked = !!prev?.unlocked_at;
    const tierChanged = (prev?.tier ?? null) !== tier;

    if (prev && prev.progress === progress && !tierChanged) continue;

    await supabaseAdmin.from("user_badges").upsert(
      {
        user_id: userId,
        badge_id: b.id,
        progress,
        tier,
        unlocked_at: unlocked ? (prev?.unlocked_at ?? new Date().toISOString()) : null,
        ...(unlocked && (!wasUnlocked || tierChanged) ? { seen_at: null } : {}),
      },
      { onConflict: "user_id,badge_id" },
    );

    if (unlocked && (!wasUnlocked || tierChanged)) {
      newlyUnlocked.push(b.code);
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: "badge_unlocked",
        title: "¡Nueva insignia desbloqueada!",
        body: b.name_es,
        url: "/app/insignias",
      });
    }
  }

  return newlyUnlocked;
}

/** Admin: set manual progress for a badge and unlock/notify accordingly. */
export async function setManualBadgeProgress(
  userId: string,
  badgeId: string,
  progress: number,
  adminId: string,
  note?: string | null,
): Promise<void> {
  const { data: badge } = await supabaseAdmin
    .from("badges")
    .select("id, kind, tiers, name_es")
    .eq("id", badgeId)
    .maybeSingle();
  if (!badge) throw new Error("Insignia no encontrada");

  const tiers = parseTiers(badge.tiers);
  const tier = badge.kind === "tiered" ? tierForProgress(tiers, progress) : null;
  const unlocked = badge.kind === "tiered" ? !!tier : progress > 0;

  const { data: prev } = await supabaseAdmin
    .from("user_badges")
    .select("tier, unlocked_at")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  const changed = unlocked && (!prev?.unlocked_at || (prev?.tier ?? null) !== tier);

  await supabaseAdmin.from("user_badges").upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      progress,
      tier,
      unlocked_at: unlocked ? (prev?.unlocked_at ?? new Date().toISOString()) : null,
      awarded_by: adminId,
      note: note ?? null,
      ...(changed ? { seen_at: null } : {}),
    },
    { onConflict: "user_id,badge_id" },
  );

  if (changed) {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "badge_unlocked",
      title: "¡Nueva insignia desbloqueada!",
      body: badge.name_es,
      url: "/app/insignias",
    });
  }
}
