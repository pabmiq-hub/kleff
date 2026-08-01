import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const REFERRAL_SIGNUP_POINTS = 15;
export const REFERRAL_LOYALTY_POINTS = 10;

// ---------------- Member: my referrals ----------------

export const getMyReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("karma_referrals")
      .select("id, referred_name, signup_awarded, loyalty_awarded, note, created_at")
      .eq("referrer_id", context.userId)
      .order("created_at", { ascending: false });
    return { referrals: data ?? [] };
  });

export const createMyReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        referredName: z.string().min(2).max(120),
        note: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("karma_referrals").insert({
      referrer_id: context.userId,
      referred_name: data.referredName,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Admin: validate referrals ----------------

export const adminListReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data } = await supabaseAdmin
      .from("karma_referrals")
      .select("id, referrer_id, referred_name, referred_user_id, signup_awarded, loyalty_awarded, note, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    const ids = [...new Set((data ?? []).map((r) => r.referrer_id))];
    let names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, username, member_number")
        .in("id", ids);
      names = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, `${p.full_name || p.username} (#${p.member_number})`]),
      );
    }

    return {
      referrals: (data ?? []).map((r) => ({ ...r, referrerName: names[r.referrer_id] ?? "—" })),
    };
  });

export const adminAwardReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        kind: z.enum(["signup", "loyalty"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { activeSeasonId, notifyUser } = await import("@/lib/karma.server");

    const { data: ref } = await supabaseAdmin
      .from("karma_referrals")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!ref) throw new Error("Referido no encontrado");
    if (data.kind === "signup" && ref.signup_awarded) throw new Error("El alta ya fue premiada");
    if (data.kind === "loyalty" && ref.loyalty_awarded) throw new Error("La fidelización ya fue premiada");
    if (data.kind === "loyalty" && !ref.signup_awarded) throw new Error("Primero valida el alta del referido");

    const points = data.kind === "signup" ? REFERRAL_SIGNUP_POINTS : REFERRAL_LOYALTY_POINTS;
    const label =
      data.kind === "signup"
        ? `Referido: alta de ${ref.referred_name}`
        : `Referido: fidelización de ${ref.referred_name}`;

    const seasonId = await activeSeasonId();
    const now = new Date().toISOString();

    const { error: insErr } = await supabaseAdmin.from("karma_entries").insert({
      user_id: ref.referrer_id,
      category_id: null,
      season_id: seasonId,
      points,
      status: "approved",
      description: label,
      created_by: context.userId,
      decided_by: context.userId,
      decided_at: now,
    });
    if (insErr) throw new Error(insErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("karma_referrals")
      .update(data.kind === "signup" ? { signup_awarded: true } : { loyalty_awarded: true })
      .eq("id", ref.id);
    if (updErr) throw new Error(updErr.message);

    await notifyUser(
      ref.referrer_id,
      "karma_referral",
      "Karma por referido",
      `${label}: +${points} puntos.`,
    );

    return { success: true, points };
  });

export const adminDeleteReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("karma_referrals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
