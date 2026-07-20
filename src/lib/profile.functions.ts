import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, member_number, username, full_name, avatar_url, date_of_birth, gender, created_at, ludoya_username")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    return {
      profile: data,
      roles: (roles ?? []).map((r) => r.role),
    };
  });

const updateSchema = z.object({
  fullName: z.string().min(2).max(120),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  gender: z.enum(["female", "male", "non_binary", "other", "prefer_not_to_say"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Username uniqueness check (excluding self)
    const { data: existing } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .neq("id", context.userId)
      .maybeSingle();
    if (existing) throw new Error("Ese nombre de usuario ya está en uso");

    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        username: data.username,
        avatar_url: data.avatarUrl ?? null,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Public: verify a member by profile id (QR carnet) ----------------

export const verifyMember = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, member_number, full_name, username, avatar_url, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return { valid: false as const };
    return {
      valid: true as const,
      member: {
        memberNumber: profile.member_number,
        fullName: profile.full_name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        memberSince: profile.created_at,
      },
    };
  });
