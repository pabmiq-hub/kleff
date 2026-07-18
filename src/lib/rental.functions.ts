import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { nextGameNight, gameNightAfter, toISODate } from "@/lib/gameNights";

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

// ---------------- Catalog ----------------

const locationSchema = z
  .object({
    shelf: z
      .enum(["A", "B", "C", "D", "1", "2", "3", "4", "on_demand", "drawer"])
      .nullable()
      .optional(),
    shape: z.enum(["triangle", "heart", "square"]).nullable().optional(),
    shelfColor: z.enum(["green", "pink", "red", "yellow", "blue"]).nullable().optional(),
    slotNumber: z.number().int().min(1).max(5).nullable().optional(),
    drawerNumber: z.number().int().min(1).max(4).nullable().optional(),
    drawerLetter: z.enum(["a", "b", "c", "d"]).nullable().optional(),
    notesAdmin: z.string().max(500).nullable().optional(),
  })
  .partial();


const gameSchema = z
  .object({
    title: z.string().min(2).max(200),
    description: z.string().max(2000).nullable().optional(),
    imageUrl: z.string().url().max(500).nullable().optional(),
    bggId: z.number().int().positive().nullable().optional(),
    minPlayers: z.number().int().min(1).max(99).nullable().optional(),
    maxPlayers: z.number().int().min(1).max(99).nullable().optional(),
    durationMinutes: z.number().int().min(1).max(2000).nullable().optional(),
    maxRentalDays: z.number().int().min(1).max(180).default(14),
    totalCopies: z.number().int().min(1).max(99).default(1),
    isActive: z.boolean().default(true),
  })
  .merge(locationSchema);

export const listRentalGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bgg_games")
      .select("*")
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return { games: data ?? [] };
  });

export const createRentalGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gameSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("bgg_games")
      .insert({
        title: data.title,
        description: data.description ?? null,
        image_url: data.imageUrl ?? null,
        bgg_id: data.bggId ?? null,
        min_players: data.minPlayers ?? null,
        max_players: data.maxPlayers ?? null,
        duration_minutes: data.durationMinutes ?? null,
        max_rental_days: data.maxRentalDays,
        total_copies: data.totalCopies,
        is_active: data.isActive,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { game: row };
  });

export const updateRentalGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    gameSchema.partial().extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { id, ...rest } = data;
    const update: Record<string, unknown> = {};
    if (rest.title !== undefined) update.title = rest.title;
    if (rest.description !== undefined) update.description = rest.description;
    if (rest.imageUrl !== undefined) update.image_url = rest.imageUrl;
    if (rest.bggId !== undefined) update.bgg_id = rest.bggId;
    if (rest.minPlayers !== undefined) update.min_players = rest.minPlayers;
    if (rest.maxPlayers !== undefined) update.max_players = rest.maxPlayers;
    if (rest.durationMinutes !== undefined) update.duration_minutes = rest.durationMinutes;
    if (rest.maxRentalDays !== undefined) update.max_rental_days = rest.maxRentalDays;
    if (rest.totalCopies !== undefined) update.total_copies = rest.totalCopies;
    if (rest.isActive !== undefined) update.is_active = rest.isActive;
    if (rest.shelf !== undefined) update.shelf = rest.shelf;
    if (rest.shape !== undefined) update.shape = rest.shape;
    if (rest.shelfColor !== undefined) update.shelf_color = rest.shelfColor;
    if (rest.slotNumber !== undefined) update.slot_number = rest.slotNumber;
    if (rest.drawerNumber !== undefined) update.drawer_number = rest.drawerNumber;
    if (rest.drawerLetter !== undefined) update.drawer_letter = rest.drawerLetter;
    if (rest.notesAdmin !== undefined) update.notes_admin = rest.notesAdmin;

    const { error } = await supabaseAdmin.from("bgg_games").update(update as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteRentalGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("bgg_games").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Rental settings ----------------

const SETTINGS_DEFAULT = {
  game_night_weekday: 3,
  cooldown_weeks: 4,
  monthly_quota: 2,
  block_if_overdue: true,
};

async function loadSettings() {
  const { data, error } = await supabaseAdmin
    .from("rental_settings")
    .select("game_night_weekday, cooldown_weeks, monthly_quota, block_if_overdue")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? SETTINGS_DEFAULT;
}

export const getRentalSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  );
  const { data, error } = await supabase
    .from("rental_settings")
    .select("game_night_weekday, cooldown_weeks, monthly_quota, block_if_overdue")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { settings: data ?? SETTINGS_DEFAULT };
});

export const updateRentalSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        gameNightWeekday: z.number().int().min(0).max(6),
        cooldownWeeks: z.number().int().min(0).max(52),
        monthlyQuota: z.number().int().min(0).max(20),
        blockIfOverdue: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("rental_settings")
      .update({
        game_night_weekday: data.gameNightWeekday,
        cooldown_weeks: data.cooldownWeeks,
        monthly_quota: data.monthlyQuota,
        block_if_overdue: data.blockIfOverdue,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Requests ----------------

const requestInputSchema = z.object({
  gameId: z.string().uuid(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  message: z.string().max(500).nullable().optional(),
  acceptWaitlist: z.boolean().default(false),
});

export const createRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => requestInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const settings = await loadSettings();

    // Compute pickup/return dates aligned with game nights
    const pickup = data.pickupDate
      ? new Date(`${data.pickupDate}T00:00:00`)
      : nextGameNight(new Date(), settings.game_night_weekday);
    if (pickup.getDay() !== settings.game_night_weekday) {
      throw new Error("La fecha de recogida debe ser una noche de juego.");
    }
    const ret = gameNightAfter(pickup, settings.game_night_weekday);
    const pickupISO = toISODate(pickup);
    const returnISO = toISODate(ret);

    // Anti-abuse 1: overdue rental blocks
    if (settings.block_if_overdue) {
      const { data: overdue } = await supabaseAdmin
        .from("rentals")
        .select("id")
        .eq("user_id", context.userId)
        .eq("status", "active")
        .lt("due_at", new Date().toISOString())
        .limit(1);
      if (overdue && overdue.length > 0) {
        throw new Error("Tienes una devolución atrasada. Devuelve antes de pedir otro juego.");
      }
    }

    // Anti-abuse 2: cooldown on same game
    if (settings.cooldown_weeks > 0) {
      const since = new Date();
      since.setDate(since.getDate() - settings.cooldown_weeks * 7);
      const { data: recent } = await supabaseAdmin
        .from("rental_requests")
        .select("id")
        .eq("user_id", context.userId)
        .eq("game_id", data.gameId)
        .in("status", ["pending", "approved", "waitlisted"])
        .gte("created_at", since.toISOString())
        .limit(1);
      if (recent && recent.length > 0) {
        throw new Error(`Ya pediste este juego en las últimas ${settings.cooldown_weeks} semanas.`);
      }
      const { data: recentR } = await supabaseAdmin
        .from("rentals")
        .select("id")
        .eq("user_id", context.userId)
        .eq("game_id", data.gameId)
        .gte("started_at", since.toISOString())
        .limit(1);
      if (recentR && recentR.length > 0) {
        throw new Error(`Ya alquilaste este juego en las últimas ${settings.cooldown_weeks} semanas.`);
      }
    }

    // Anti-abuse 3: monthly quota
    if (settings.monthly_quota > 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: monthCount } = await supabaseAdmin
        .from("rental_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .in("status", ["pending", "approved", "waitlisted"])
        .gte("created_at", monthStart.toISOString());
      if ((monthCount ?? 0) >= settings.monthly_quota) {
        throw new Error(`Has alcanzado tu cuota mensual de ${settings.monthly_quota} alquileres.`);
      }
    }

    // Availability for that pickup date
    const { data: game, error: gErr } = await supabaseAdmin
      .from("bgg_games")
      .select("total_copies")
      .eq("id", data.gameId)
      .maybeSingle();
    if (gErr) throw new Error(gErr.message);
    if (!game) throw new Error("Juego no encontrado");

    const { count: heldCount } = await supabaseAdmin
      .from("rental_requests")
      .select("id", { count: "exact", head: true })
      .eq("game_id", data.gameId)
      .eq("pickup_date", pickupISO)
      .in("status", ["pending", "approved"]);

    const free = (game.total_copies ?? 1) - (heldCount ?? 0);
    let status: "pending" | "waitlisted" = "pending";
    let waitlistPos: number | null = null;
    if (free <= 0) {
      if (!data.acceptWaitlist) {
        throw new Error("No hay copias libres para esa fecha. Activa la lista de espera para apuntarte.");
      }
      status = "waitlisted";
      const { count: wlCount } = await supabaseAdmin
        .from("rental_requests")
        .select("id", { count: "exact", head: true })
        .eq("game_id", data.gameId)
        .eq("pickup_date", pickupISO)
        .eq("status", "waitlisted");
      waitlistPos = (wlCount ?? 0) + 1;
    }

    const requestedDays = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
    const { error } = await supabaseAdmin.from("rental_requests").insert({
      user_id: context.userId,
      game_id: data.gameId,
      requested_days: requestedDays,
      message: data.message ?? null,
      status,
      pickup_date: pickupISO,
      return_date: returnISO,
      waitlist_position: waitlistPos,
    });
    if (error) throw new Error(error.message);
    return { success: true, status, pickupDate: pickupISO, returnDate: returnISO, waitlistPosition: waitlistPos };
  });

export const cancelRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("rental_requests")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .in("status", ["pending", "waitlisted"]);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listMyRentalRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rental_requests")
      .select("*, bgg_games(title, image_url)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const listAllRentalRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "cancelled", "waitlisted"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    let q = supabaseAdmin
      .from("rental_requests")
      .select("*, bgg_games(title, image_url, total_copies)")
      .order("pickup_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, member_number")
      .in("id", userIds);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    return {
      requests: (rows ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null })),
    };
  });

export const decideRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    const { data: req, error: reqErr } = await supabaseAdmin
      .from("rental_requests")
      .select("id, user_id, game_id, requested_days, status, pickup_date, return_date")
      .eq("id", data.id)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req) throw new Error("Solicitud no encontrada");
    if (req.status !== "pending" && req.status !== "waitlisted") {
      throw new Error("La solicitud ya está resuelta");
    }

    const { error: updErr } = await supabaseAdmin
      .from("rental_requests")
      .update({
        status: data.decision,
        decided_at: new Date().toISOString(),
        decided_by: context.userId,
        decision_note: data.note ?? null,
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    let dueAtIso: string | null = null;
    if (data.decision === "approved") {
      const startedAt = req.pickup_date ? new Date(`${req.pickup_date}T18:00:00`) : new Date();
      const dueAt = req.return_date
        ? new Date(`${req.return_date}T23:59:00`)
        : new Date(Date.now() + (req.requested_days ?? 7) * 86400000);
      dueAtIso = dueAt.toISOString();
      const { error: rErr } = await supabaseAdmin.from("rentals").insert({
        user_id: req.user_id,
        game_id: req.game_id,
        request_id: req.id,
        started_at: startedAt.toISOString(),
        due_at: dueAtIso,
        status: "active",
        created_by: context.userId,
      });
      if (rErr) throw new Error(rErr.message);
    }

    // Notify the requester
    try {
      const { data: game } = await supabaseAdmin
        .from("bgg_games")
        .select("title")
        .eq("id", req.game_id)
        .maybeSingle();
      const gameTitle = game?.title ?? "el juego";
      const approved = data.decision === "approved";
      const title = approved ? "Alquiler aprobado" : "Alquiler rechazado";
      const dueLabel = dueAtIso
        ? new Date(dueAtIso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
        : null;
      const body = approved
        ? `Tu solicitud para "${gameTitle}" ha sido aprobada${dueLabel ? `. Devolución antes del ${dueLabel}` : ""}.${data.note ? ` Nota: ${data.note}` : ""}`
        : `Tu solicitud para "${gameTitle}" ha sido rechazada.${data.note ? ` Motivo: ${data.note}` : ""}`;
      await supabaseAdmin.from("notifications").insert({
        user_id: req.user_id,
        type: approved ? "rental_approved" : "rental_rejected",
        title,
        body,
        url: "/app/rentals/mine",
      });
    } catch {
      // Non-blocking: don't fail the decision if notification insert fails
    }
    return { success: true };
  });

// ---------------- Rentals ----------------

export const listMyRentals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rentals")
      .select("*, bgg_games(title, image_url)")
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rentals: data ?? [] };
  });

export const listAllRentals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["active", "returned", "overdue", "lost"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    let q = supabaseAdmin
      .from("rentals")
      .select("*, bgg_games(title, image_url)")
      .order("started_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, member_number")
      .in("id", userIds);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    return {
      rentals: (rows ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null })),
    };
  });

export const markRentalReturned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(500).nullable().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("rentals")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
        notes: data.notes ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- KPIs ----------------

export const getAdminKpis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);

    const [members, pendingInvites, pendingReq, activeRentals] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()),
      supabaseAdmin
        .from("rental_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

    return {
      members: members.count ?? 0,
      pendingInvitations: pendingInvites.count ?? 0,
      pendingRequests: pendingReq.count ?? 0,
      activeRentals: activeRentals.count ?? 0,
    };
  });
