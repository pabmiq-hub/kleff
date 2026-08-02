import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------- Admin: pending queue + all entries ----------------

export const adminListKarmaEntries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ status: z.enum(["pending", "approved", "rejected", "voided", "all"]).default("pending") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("karma_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: entries, error } = await query;
    if (error) throw new Error(error.message);

    const userIds = [...new Set((entries ?? []).map((e) => e.user_id))];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, username, member_number").in("id", userIds)
      : { data: [] as { id: string; full_name: string; username: string; member_number: number }[] };
    const { data: categories } = await supabaseAdmin
      .from("karma_categories")
      .select("id, name_es, grp, points, points_min, points_max, limit_period, limit_count");

    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const catMap = new Map((categories ?? []).map((c) => [c.id, c]));

    return {
      entries: (entries ?? []).map((e) => {
        const cat = e.category_id ? catMap.get(e.category_id) : undefined;
        const prof = profMap.get(e.user_id);
        return {
          ...e,
          memberName: prof ? prof.full_name || prof.username : "—",
          memberNumber: prof?.member_number ?? null,
          categoryName: cat?.name_es ?? "Ajuste manual",
          categoryGroup: cat?.grp ?? null,
          pointsMin: cat?.points_min ?? null,
          pointsMax: cat?.points_max ?? null,
        };
      }),
    };
  });

// ---------------- Admin: approve / reject an entry ----------------

export const adminDecideKarmaEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entryId: z.string().uuid(),
        approve: z.boolean(),
        points: z.number().int().min(0).max(1000).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyUser, activeSeasonId } = await import("@/lib/karma.server");

    const { data: entry } = await supabaseAdmin
      .from("karma_entries")
      .select("id, user_id, points, status")
      .eq("id", data.entryId)
      .maybeSingle();
    if (!entry) throw new Error("Contribución no encontrada");
    if (entry.status !== "pending") throw new Error("Esta contribución ya ha sido resuelta");

    const points = data.approve ? (data.points ?? entry.points) : 0;
    const seasonId = await activeSeasonId();

    const { error } = await supabaseAdmin
      .from("karma_entries")
      .update({
        status: data.approve ? "approved" : "rejected",
        points,
        season_id: seasonId,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
        decision_note: data.note ?? null,
      })
      .eq("id", entry.id);
    if (error) throw new Error(error.message);

    await notifyUser(
      entry.user_id,
      data.approve ? "karma_approved" : "karma_rejected",
      data.approve ? "Karma aprobado" : "Contribución rechazada",
      data.approve
        ? `Se han añadido ${points} puntos de Karma a tu saldo.`
        : `Tu contribución no ha sido aprobada.${data.note ? ` Motivo: ${data.note}` : ""}`,
    );
    return { success: true };
  });

// ---------------- Admin: grant points directly ----------------

export const adminGrantKarma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        categoryId: z.string().uuid().nullable().optional(),
        points: z.number().int().min(-1000).max(1000),
        description: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyUser, activeSeasonId } = await import("@/lib/karma.server");

    const seasonId = await activeSeasonId();
    const { error } = await supabaseAdmin.from("karma_entries").insert({
      user_id: data.userId,
      category_id: data.categoryId ?? null,
      season_id: seasonId,
      points: data.points,
      status: "approved",
      description: data.description ?? null,
      created_by: context.userId,
      decided_by: context.userId,
      decided_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    await notifyUser(
      data.userId,
      "karma_granted",
      data.points >= 0 ? "Has recibido Karma" : "Ajuste de Karma",
      `${data.points >= 0 ? "+" : ""}${data.points} puntos.${data.description ? ` ${data.description}` : ""}`,
    );
    return { success: true };
  });

// ---------------- Admin: void an approved entry ----------------

export const adminVoidKarmaEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ entryId: z.string().uuid(), note: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyUser } = await import("@/lib/karma.server");

    const { data: entry } = await supabaseAdmin
      .from("karma_entries")
      .select("id, user_id, points")
      .eq("id", data.entryId)
      .maybeSingle();
    if (!entry) throw new Error("Contribución no encontrada");

    const { error } = await supabaseAdmin
      .from("karma_entries")
      .update({
        status: "voided",
        decision_note: data.note ?? null,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", entry.id);
    if (error) throw new Error(error.message);

    await notifyUser(
      entry.user_id,
      "karma_voided",
      "Karma anulado",
      `Se han retirado ${entry.points} puntos.${data.note ? ` Motivo: ${data.note}` : ""}`,
    );
    return { success: true };
  });

// ---------------- Admin: categories CRUD ----------------

const categorySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  code: z.string().min(2).max(60),
  grp: z.enum(["ludoteca", "difusion", "referidos", "participacion", "organizacion", "otras"]),
  nameEs: z.string().min(2).max(160),
  nameCa: z.string().max(160).optional().default(""),
  nameEn: z.string().max(160).optional().default(""),
  descriptionEs: z.string().max(600).optional().default(""),
  points: z.number().int().min(0).max(1000),
  pointsMin: z.number().int().min(0).max(1000).nullable().optional(),
  pointsMax: z.number().int().min(0).max(1000).nullable().optional(),
  limitPeriod: z.enum(["none", "weekly", "monthly"]),
  limitCount: z.number().int().min(1).max(100).nullable().optional(),
  memberRequestable: z.boolean(),
  requiresEvidence: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const adminListKarmaConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: categories }, { data: rewards }, { data: seasons }] = await Promise.all([
      supabaseAdmin.from("karma_categories").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("karma_rewards").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("karma_seasons").select("*").order("starts_on", { ascending: false }),
    ]);
    return { categories: categories ?? [], rewards: rewards ?? [], seasons: seasons ?? [] };
  });

export const adminSaveKarmaCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categorySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      code: data.code,
      grp: data.grp,
      name_es: data.nameEs,
      name_ca: data.nameCa || data.nameEs,
      name_en: data.nameEn || data.nameEs,
      description_es: data.descriptionEs ?? "",
      points: data.points,
      points_min: data.pointsMin ?? null,
      points_max: data.pointsMax ?? null,
      limit_period: data.limitPeriod,
      limit_count: data.limitPeriod === "none" ? null : (data.limitCount ?? null),
      member_requestable: data.memberRequestable,
      requires_evidence: data.requiresEvidence,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("karma_categories").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { success: true, id: data.id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("karma_categories")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { success: true, id: created.id };
  });

export const adminDeleteKarmaCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("karma_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Admin: rewards CRUD ----------------

const rewardSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  code: z.string().min(2).max(60),
  nameEs: z.string().min(2).max(160),
  nameCa: z.string().max(160).optional().default(""),
  nameEn: z.string().max(160).optional().default(""),
  descriptionEs: z.string().max(600).optional().default(""),
  cost: z.number().int().min(1).max(10000),
  effect: z.enum([
    "manual",
    "fee_discount",
    "raffle_ticket",
    "extra_rental",
    "extend_rental",
    "tournament_discount",
    "priority_access",
    "double_vote",
  ]),
  effectValue: z.number().int().min(0).max(10000).nullable().optional(),
  stock: z.number().int().min(0).max(10000).nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
});

export const adminSaveKarmaReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rewardSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      code: data.code,
      name_es: data.nameEs,
      name_ca: data.nameCa || data.nameEs,
      name_en: data.nameEn || data.nameEs,
      description_es: data.descriptionEs ?? "",
      cost: data.cost,
      effect: data.effect,
      effect_value: data.effectValue ?? null,
      stock: data.stock ?? null,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("karma_rewards").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { success: true, id: data.id };
    }
    const { data: created, error } = await supabaseAdmin.from("karma_rewards").insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { success: true, id: created.id };
  });

export const adminDeleteKarmaReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("karma_rewards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Admin: redemptions ----------------

export const adminListKarmaRedemptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: redemptions, error } = await supabaseAdmin
      .from("karma_redemptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const userIds = [...new Set((redemptions ?? []).map((r) => r.user_id))];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, username, member_number").in("id", userIds)
      : { data: [] as { id: string; full_name: string; username: string; member_number: number }[] };
    const { data: rewards } = await supabaseAdmin.from("karma_rewards").select("id, name_es, effect, effect_value");

    const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const rewardMap = new Map((rewards ?? []).map((r) => [r.id, r]));

    return {
      redemptions: (redemptions ?? []).map((r) => ({
        ...r,
        memberName: profMap.get(r.user_id)
          ? profMap.get(r.user_id)!.full_name || profMap.get(r.user_id)!.username
          : "—",
        memberNumber: profMap.get(r.user_id)?.member_number ?? null,
        rewardName: r.reward_id ? (rewardMap.get(r.reward_id)?.name_es ?? "—") : "—",
        effect: r.reward_id ? (rewardMap.get(r.reward_id)?.effect ?? "manual") : "manual",
      })),
    };
  });

export const adminDecideKarmaRedemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        redemptionId: z.string().uuid(),
        action: z.enum(["approve", "deliver", "reject"]),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyUser } = await import("@/lib/karma.server");

    const { data: red } = await supabaseAdmin
      .from("karma_redemptions")
      .select("*")
      .eq("id", data.redemptionId)
      .maybeSingle();
    if (!red) throw new Error("Canje no encontrado");
    if (red.status === "rejected") throw new Error("Este canje ya fue rechazado");

    const { data: reward } = red.reward_id
      ? await supabaseAdmin.from("karma_rewards").select("*").eq("id", red.reward_id).maybeSingle()
      : { data: null };

    if (data.action === "reject") {
      const { error } = await supabaseAdmin
        .from("karma_redemptions")
        .update({
          status: "rejected",
          note: data.note ?? red.note,
          decided_by: context.userId,
          decided_at: new Date().toISOString(),
        })
        .eq("id", red.id);
      if (error) throw new Error(error.message);
      await notifyUser(
        red.user_id,
        "karma_redemption_rejected",
        "Canje rechazado",
        `Se te han devuelto ${red.points_spent} puntos de Karma.${data.note ? ` Motivo: ${data.note}` : ""}`,
      );
      return { success: true };
    }

    // Apply automatic effects on first approval
    if (red.status === "requested" && reward) {
      const now = new Date();
      if (reward.effect === "extend_rental" && red.target_rental_id) {
        const { data: rental } = await supabaseAdmin
          .from("rentals")
          .select("id, due_at")
          .eq("id", red.target_rental_id)
          .maybeSingle();
        if (rental) {
          const newDue = new Date(rental.due_at);
          newDue.setDate(newDue.getDate() + (reward.effect_value ?? 7));
          await supabaseAdmin.from("rentals").update({ due_at: newDue.toISOString() }).eq("id", rental.id);
        }
      } else if (reward.effect !== "manual") {
        const expires = new Date(now);
        if (reward.effect === "extra_rental") expires.setDate(expires.getDate() + 7);
        else if (reward.effect === "priority_access") expires.setHours(expires.getHours() + (reward.effect_value ?? 48));
        else expires.setFullYear(expires.getFullYear() + 1);

        await supabaseAdmin.from("karma_perks").insert({
          user_id: red.user_id,
          redemption_id: red.id,
          kind: reward.effect,
          value: reward.effect_value ?? null,
          expires_at: expires.toISOString(),
        });
      }
      if (reward.stock !== null && reward.stock !== undefined) {
        await supabaseAdmin
          .from("karma_rewards")
          .update({ stock: Math.max(0, reward.stock - 1) })
          .eq("id", reward.id);
      }
    }

    const { error } = await supabaseAdmin
      .from("karma_redemptions")
      .update({
        status: data.action === "deliver" ? "delivered" : "approved",
        note: data.note ?? red.note,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", red.id);
    if (error) throw new Error(error.message);

    await notifyUser(
      red.user_id,
      "karma_redemption",
      data.action === "deliver" ? "Recompensa entregada" : "Canje aprobado",
      `${reward?.name_es ?? "Tu recompensa"} — ${red.points_spent} puntos.`,
    );
    return { success: true };
  });

// ---------------- Admin: per-member karma cycles ----------------

export const adminSaveKarmaSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ carryoverMax: z.number().int().min(0).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("karma_settings")
      .upsert({ id: true, carryover_max: data.carryoverMax, updated_by: context.userId });
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Lists every member with their current karma cycle window and balance. */
export const adminListKarmaCycles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureUserCycle, karmaBalance } = await import("@/lib/karma.server");

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, created_at")
      .order("created_at", { ascending: true });

    const rows: {
      userId: string;
      name: string;
      signupAt: string;
      cycleIndex: number;
      startsAt: string;
      endsAt: string;
      carryoverIn: number;
      balance: number;
    }[] = [];

    for (const p of profiles ?? []) {
      const cycle = await ensureUserCycle(p.id);
      const balance = await karmaBalance(p.id);
      rows.push({
        userId: p.id,
        name: p.full_name || p.username,
        signupAt: p.created_at,
        cycleIndex: cycle.cycleIndex,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        carryoverIn: cycle.carryoverIn,
        balance,
      });
    }
    rows.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
    return { cycles: rows };
  });


// ---------------- Admin: per-member karma summary ----------------

export const adminGetMemberKarma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { karmaBalance, karmaLifetime } = await import("@/lib/karma.server");

    const [balance, lifetime] = await Promise.all([karmaBalance(data.userId), karmaLifetime(data.userId)]);
    const { data: entries } = await supabaseAdmin
      .from("karma_entries")
      .select("id, points, status, description, created_at, category_id")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    const { data: categories } = await supabaseAdmin.from("karma_categories").select("id, name_es");
    const catMap = new Map((categories ?? []).map((c) => [c.id, c.name_es]));

    // Fee discount vouchers earned (50 pts = 1 €), not consumed and not expired
    const { data: perks } = await supabaseAdmin
      .from("karma_perks")
      .select("value, expires_at, consumed_at, redemption_id")
      .eq("user_id", data.userId)
      .eq("kind", "fee_discount")
      .is("consumed_at", null);
    const nowMs = Date.now();
    const validPerks = (perks ?? []).filter((p) => !p.expires_at || new Date(p.expires_at).getTime() > nowMs);
    let feeDiscountEuros = 0;
    if (validPerks.length > 0) {
      const redIds = validPerks.map((p) => p.redemption_id).filter(Boolean) as string[];
      let spentMap: Record<string, number> = {};
      if (redIds.length > 0) {
        const { data: reds } = await supabaseAdmin
          .from("karma_redemptions")
          .select("id, points_spent")
          .in("id", redIds);
        spentMap = Object.fromEntries((reds ?? []).map((r) => [r.id, r.points_spent ?? 0]));
      }
      feeDiscountEuros = validPerks.reduce((sum, p) => {
        if (p.value && p.value > 0) return sum + p.value;
        const spent = p.redemption_id ? (spentMap[p.redemption_id] ?? 0) : 0;
        return sum + Math.floor(spent / 50);
      }, 0);
    }

    return {
      balance,
      lifetime,
      feeDiscountEuros,
      entries: (entries ?? []).map((e) => ({
        ...e,
        categoryName: e.category_id ? (catMap.get(e.category_id) ?? "—") : "Ajuste manual",
      })),
    };
  });
