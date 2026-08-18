import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BADGE_FIELDS =
  "id, code, kind, grp, icon, color, name_es, name_ca, name_en, description_es, description_ca, description_en, tiers, sort_order";

/** Full badge catalogue + the caller's progress, recomputed on the fly. */
export const getMyBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { recomputeUserBadges } = await import("@/lib/badges.server");
    await recomputeUserBadges(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: badges }, { data: mine }] = await Promise.all([
      supabaseAdmin.from("badges").select(BADGE_FIELDS).eq("is_active", true).order("sort_order"),
      supabaseAdmin
        .from("user_badges")
        .select("badge_id, progress, tier, unlocked_at, seen_at")
        .eq("user_id", context.userId),
    ]);
    const byBadge = new Map((mine ?? []).map((m) => [m.badge_id, m]));
    return {
      badges: (badges ?? []).map((b) => ({
        badge: b,
        progress: byBadge.get(b.id)?.progress ?? 0,
        tier: byBadge.get(b.id)?.tier ?? null,
        unlockedAt: byBadge.get(b.id)?.unlocked_at ?? null,
        seenAt: byBadge.get(b.id)?.seen_at ?? null,
      })),
    };
  });

/** Unlocked badges of any member (for community profiles). */
export const getMemberBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("user_badges")
      .select(`progress, tier, unlocked_at, badges!inner(${BADGE_FIELDS})`)
      .eq("user_id", data.userId)
      .not("unlocked_at", "is", null);
    return {
      badges: (rows ?? []).map((r) => ({
        badge: r.badges as never,
        progress: r.progress,
        tier: r.tier,
        unlockedAt: r.unlocked_at,
        seenAt: null,
      })),
    };
  });

/** Mark unlock popups as seen for the caller. */
export const markBadgesSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ badgeIds: z.array(z.string().uuid()).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!data.badgeIds.length) return { success: true };
    const { error } = await context.supabase
      .from("user_badges")
      .update({ seen_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .in("badge_id", data.badgeIds);
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Admin: adjust or award a badge manually. */
export const setMemberBadgeProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        badgeId: z.string().uuid(),
        progress: z.number().int().min(0).max(10000),
        note: z.string().max(500).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { setManualBadgeProgress } = await import("@/lib/badges.server");
    await setManualBadgeProgress(
      data.userId,
      data.badgeId,
      data.progress,
      context.userId,
      data.note ?? null,
    );
    return { success: true };
  });

/** Admin: full badge catalogue with a member's progress (manual + automatic). */
export const getMemberBadgesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { recomputeUserBadges } = await import("@/lib/badges.server");
    await recomputeUserBadges(data.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: badges }, { data: rows }] = await Promise.all([
      supabaseAdmin
        .from("badges")
        .select(`${BADGE_FIELDS}, source, auto_metric`)
        .eq("is_active", true)
        .order("sort_order"),
      supabaseAdmin
        .from("user_badges")
        .select("badge_id, progress, tier, unlocked_at")
        .eq("user_id", data.userId),
    ]);
    const byBadge = new Map((rows ?? []).map((m) => [m.badge_id, m]));
    return {
      badges: (badges ?? []).map((b) => ({
        badge: b,
        progress: byBadge.get(b.id)?.progress ?? 0,
        tier: byBadge.get(b.id)?.tier ?? null,
        unlockedAt: byBadge.get(b.id)?.unlocked_at ?? null,
        seenAt: null,
      })),
    };
  });
