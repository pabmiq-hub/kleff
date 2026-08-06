import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const answersSchema = z.object({
  areas: z.array(z.string().max(120)).max(20),
  eventCategories: z.array(z.string().max(120)).max(20),
  eventRoles: z.array(z.string().max(120)).max(20),
  benefits: z.array(z.string().max(120)).max(20),
  languages: z.array(z.string().max(60)).max(10),
  institutional: z.array(z.string().max(120)).max(10),
  availability: z.string().max(500),
  duesOpinion: z.enum(["yes", "no", ""]),
  duesAmount: z.string().max(40),
  duesBenefits: z.string().max(1000),
  comments: z.string().max(2000),
});

/** Solicitud del socio actual (si tiene alguna) + datos precargados del perfil. */
export const getMyVolunteerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: application } = await supabaseAdmin
      .from("volunteer_applications")
      .select("id, status, answers, created_at, decided_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    return {
      application: application ?? null,
      prefill: {
        fullName: profile?.full_name ?? "",
        email: (context.claims?.email as string | undefined) ?? "",
      },
    };
  });

export const submitVolunteerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().min(2).max(120),
        email: z.string().email().max(160),
        phone: z.string().max(40).nullable().optional(),
        answers: answersSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pending } = await supabaseAdmin
      .from("volunteer_applications")
      .select("id")
      .eq("user_id", context.userId)
      .in("status", ["pending", "reviewing"])
      .maybeSingle();
    if (pending) throw new Error("Ya tienes una solicitud en curso");

    const { error } = await supabaseAdmin.from("volunteer_applications").insert({
      user_id: context.userId,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      answers: data.answers,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    const { notifyAdminsNewApplication } = await import("@/lib/volunteers.server");
    await notifyAdminsNewApplication(data.fullName, data.email);

    return { success: true as const };
  });

export const adminListVolunteerApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("volunteer_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const ids = [...new Set((data ?? []).map((a) => a.user_id))];
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, username, member_number, avatar_url").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

    return {
      applications: (data ?? []).map((a) => ({
        id: a.id,
        userId: a.user_id,
        fullName: a.full_name,
        email: a.email,
        phone: a.phone,
        status: a.status,
        adminNotes: a.admin_notes,
        createdAt: a.created_at,
        decidedAt: a.decided_at,
        answers: (a.answers ?? {}) as Record<string, unknown>,
        member: byId.get(a.user_id) ?? null,
      })),
    };
  });

export const adminUpdateVolunteerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "reviewing", "accepted", "declined"]).optional(),
        adminNotes: z.string().max(4000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin } = await import("@/lib/assert-role.server");
    await assertSuperAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("volunteer_applications")
      .select("user_id, status")
      .eq("id", data.id)
      .maybeSingle();

    const payload: Record<string, unknown> = {};
    if (data.status) {
      payload.status = data.status;
      payload.decided_at = data.status === "pending" ? null : new Date().toISOString();
    }
    if (data.adminNotes !== undefined) payload.admin_notes = data.adminNotes;

    const { error } = await supabaseAdmin.from("volunteer_applications").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.status && before && before.status !== data.status) {
      const { notifyApplicant } = await import("@/lib/volunteers.server");
      await notifyApplicant(before.user_id, data.status);
    }

    return { success: true as const };
  });
