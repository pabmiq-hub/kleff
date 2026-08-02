import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------------- Catalog (categories + rewards) ----------------

export const getKarmaCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: categories }, { data: rewards }, { data: season }] = await Promise.all([
      supabaseAdmin
        .from("karma_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("karma_rewards")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("karma_seasons")
        .select("id, name, starts_on, ends_on, carryover_max")
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    return { categories: categories ?? [], rewards: rewards ?? [], season: season ?? null };
  });

// ---------------- My karma overview ----------------

export const getMyKarma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { karmaBalance, karmaLifetime, ensureUserCycle, karmaCarryoverMax } = await import(
      "@/lib/karma.server"
    );
    const userId = context.userId;

    const [balance, lifetime, cycle, carryoverMax] = await Promise.all([
      karmaBalance(userId),
      karmaLifetime(userId),
      ensureUserCycle(userId),
      karmaCarryoverMax(),
    ]);


    const { data: entries } = await supabaseAdmin
      .from("karma_entries")
      .select("id, points, status, description, evidence_url, decision_note, created_at, decided_at, category_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: categories } = await supabaseAdmin
      .from("karma_categories")
      .select("id, name_es, grp, points, limit_period, limit_count");

    const { data: redemptions } = await supabaseAdmin
      .from("karma_redemptions")
      .select("id, points_spent, status, note, created_at, reward_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: rewards } = await supabaseAdmin.from("karma_rewards").select("id, name_es, effect");

    const { data: perks } = await supabaseAdmin
      .from("karma_perks")
      .select("id, kind, value, expires_at, consumed_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("karma_ranking_opt_in")
      .eq("id", userId)
      .maybeSingle();

    const { data: activeRentals } = await supabaseAdmin
      .from("rentals")
      .select("id, due_at, game_id")
      .eq("user_id", userId)
      .eq("status", "active");

    const gameIds = (activeRentals ?? []).map((r) => r.game_id).filter(Boolean) as string[];
    let gameTitles: Record<string, string> = {};
    if (gameIds.length > 0) {
      const { data: games } = await supabaseAdmin.from("bgg_games").select("id, title").in("id", gameIds);
      gameTitles = Object.fromEntries((games ?? []).map((g) => [g.id, g.title]));
    }

    const catMap = new Map((categories ?? []).map((c) => [c.id, c]));
    const rewardMap = new Map((rewards ?? []).map((r) => [r.id, r]));

    return {
      balance,
      lifetime,
      cycle: {
        index: cycle.cycleIndex,
        startsAt: cycle.startsAt,
        endsAt: cycle.endsAt,
        carryoverIn: cycle.carryoverIn,
        carryoverMax,
      },
      rankingOptIn: profile?.karma_ranking_opt_in ?? true,

      entries: (entries ?? []).map((e) => ({
        ...e,
        categoryName: e.category_id ? (catMap.get(e.category_id)?.name_es ?? "—") : "Ajuste manual",
      })),
      redemptions: (redemptions ?? []).map((r) => ({
        ...r,
        rewardName: r.reward_id ? (rewardMap.get(r.reward_id)?.name_es ?? "—") : "—",
        effect: r.reward_id ? (rewardMap.get(r.reward_id)?.effect ?? "manual") : "manual",
      })),
      perks: perks ?? [],
      activeRentals: (activeRentals ?? []).map((r) => ({
        id: r.id,
        dueAt: r.due_at,
        title: r.game_id ? (gameTitles[r.game_id] ?? "Juego") : "Juego",
      })),
    };
  });

// ---------------- Submit a contribution ----------------

export const submitKarmaEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        categoryId: z.string().uuid(),
        description: z.string().max(1000).optional(),
        evidenceUrl: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { activeSeasonId, categoryUsage } = await import("@/lib/karma.server");

    const { data: category, error: catErr } = await supabaseAdmin
      .from("karma_categories")
      .select("*")
      .eq("id", data.categoryId)
      .maybeSingle();
    if (catErr) throw new Error(catErr.message);
    if (!category || !category.is_active) throw new Error("Categoría no disponible");
    if (!category.member_requestable) throw new Error("Esta categoría solo la puede registrar el equipo organizador");
    if (category.requires_evidence && !data.evidenceUrl) throw new Error("Esta categoría requiere una evidencia (enlace o imagen)");

    if (category.limit_period !== "none" && category.limit_count) {
      const used = await categoryUsage(context.userId, category.id, category.limit_period);
      if (used >= category.limit_count) {
        const period = category.limit_period === "weekly" ? "esta semana" : "este mes";
        throw new Error(`Has alcanzado el límite de ${category.limit_count} en esta categoría ${period}.`);
      }
    }

    const seasonId = await activeSeasonId();
    const { error } = await supabaseAdmin.from("karma_entries").insert({
      user_id: context.userId,
      category_id: category.id,
      season_id: seasonId,
      points: category.points,
      status: "pending",
      description: data.description ?? null,
      evidence_url: data.evidenceUrl ?? null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Redeem a reward ----------------

export const redeemKarmaReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rewardId: z.string().uuid(),
        targetRentalId: z.string().uuid().nullable().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { activeSeasonId, karmaBalance } = await import("@/lib/karma.server");

    const { data: reward } = await supabaseAdmin
      .from("karma_rewards")
      .select("*")
      .eq("id", data.rewardId)
      .maybeSingle();
    if (!reward || !reward.is_active) throw new Error("Recompensa no disponible");
    if (reward.stock !== null && reward.stock <= 0) throw new Error("Recompensa agotada");

    const balance = await karmaBalance(context.userId);
    if (balance < reward.cost) throw new Error(`Saldo insuficiente: necesitas ${reward.cost} puntos y tienes ${balance}.`);

    if (reward.effect === "extend_rental") {
      if (!data.targetRentalId) throw new Error("Selecciona el préstamo al que aplicar la ampliación");
      const { data: rental } = await supabaseAdmin
        .from("rentals")
        .select("id, user_id, status")
        .eq("id", data.targetRentalId)
        .maybeSingle();
      if (!rental || rental.user_id !== context.userId || rental.status !== "active") {
        throw new Error("El préstamo seleccionado no es válido");
      }
    }

    const seasonId = await activeSeasonId();
    const { error } = await supabaseAdmin.from("karma_redemptions").insert({
      user_id: context.userId,
      reward_id: reward.id,
      season_id: seasonId,
      points_spent: reward.cost,
      status: "requested",
      target_rental_id: reward.effect === "extend_rental" ? (data.targetRentalId ?? null) : null,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Ranking ----------------

export const getKarmaRanking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: entries } = await supabaseAdmin
      .from("karma_entries")
      .select("user_id, points, decided_at")
      .eq("status", "approved")
      .gte("decided_at", monthStart.toISOString());

    const totals = new Map<string, number>();
    (entries ?? []).forEach((e) => totals.set(e.user_id, (totals.get(e.user_id) ?? 0) + (e.points ?? 0)));
    if (totals.size === 0) return { ranking: [] as { userId: string; name: string; avatarUrl: string | null; points: number }[] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url, karma_ranking_opt_in")
      .in("id", [...totals.keys()]);

    const ranking = (profiles ?? [])
      .filter((p) => p.karma_ranking_opt_in)
      .map((p) => ({
        userId: p.id,
        name: p.full_name || p.username,
        avatarUrl: p.avatar_url,
        points: totals.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);

    return { ranking };
  });

export const setKarmaRankingOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ optIn: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ karma_ranking_opt_in: data.optIn })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Lightweight summary (badge) ----------------

export const getMyKarmaSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { karmaBalance, karmaLifetime } = await import("@/lib/karma.server");
    const [balance, lifetime] = await Promise.all([
      karmaBalance(context.userId),
      karmaLifetime(context.userId),
    ]);
    return { balance, lifetime };
  });
