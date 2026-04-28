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

// ---------------- Catalog ----------------

const gameSchema = z.object({
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
});

export const listRentalGames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rental_games")
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
      .from("rental_games")
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
    const { error } = await supabaseAdmin.from("rental_games").update(update).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteRentalGame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin.from("rental_games").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Requests ----------------

export const createRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        gameId: z.string().uuid(),
        requestedDays: z.number().int().min(1).max(180).default(7),
        message: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rental_requests").insert({
      user_id: context.userId,
      game_id: data.gameId,
      requested_days: data.requestedDays,
      message: data.message ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { success: true };
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
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const listMyRentalRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rental_requests")
      .select("*, rental_games(title, image_url)")
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
        status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    let q = supabaseAdmin
      .from("rental_requests")
      .select("*, rental_games(title, image_url), profiles!rental_requests_user_id_fkey(full_name, username, member_number)")
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) {
      // Fallback if FK alias not present: do manual join
      const { data: r2, error: e2 } = await supabaseAdmin
        .from("rental_requests")
        .select("*, rental_games(title, image_url)")
        .order("created_at", { ascending: false });
      if (e2) throw new Error(e2.message);
      const userIds = Array.from(new Set((r2 ?? []).map((r) => r.user_id)));
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, username, member_number")
        .in("id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      const filtered = data.status ? (r2 ?? []).filter((r) => r.status === data.status) : (r2 ?? []);
      return {
        requests: filtered.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null })),
      };
    }
    return { requests: rows ?? [] };
  });

export const decideRentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().max(500).nullable().optional(),
        rentalDays: z.number().int().min(1).max(180).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    // Load the request
    const { data: req, error: reqErr } = await supabaseAdmin
      .from("rental_requests")
      .select("id, user_id, game_id, requested_days, status")
      .eq("id", data.id)
      .maybeSingle();
    if (reqErr) throw new Error(reqErr.message);
    if (!req) throw new Error("Solicitud no encontrada");
    if (req.status !== "pending") throw new Error("La solicitud ya está resuelta");

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

    // If approved, create the rental
    if (data.decision === "approved") {
      const days = data.rentalDays ?? req.requested_days;
      const due = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { error: rErr } = await supabaseAdmin.from("rentals").insert({
        user_id: req.user_id,
        game_id: req.game_id,
        request_id: req.id,
        due_at: due,
        status: "active",
        created_by: context.userId,
      });
      if (rErr) throw new Error(rErr.message);
    }
    return { success: true };
  });

// ---------------- Rentals ----------------

export const listMyRentals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rentals")
      .select("*, rental_games(title, image_url)")
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
      .select("*, rental_games(title, image_url)")
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
