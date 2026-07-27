import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHash, randomBytes } from "crypto";
import { sendEmailSafe } from "@/lib/email/send.server";
import { invitationEmail } from "@/lib/email/templates.server";


// ---------------- Helpers ----------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

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

// ---------------- Public: validate invitation token ----------------

export const validateInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => z.object({ token: z.string().min(10).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const tokenHash = hashToken(data.token);
    const { data: invite, error } = await supabaseAdmin
      .from("invitations")
      .select("id, email, expires_at, accepted_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) return { valid: false as const, reason: "not_found" as const };
    if (invite.revoked_at) return { valid: false as const, reason: "revoked" as const };
    if (invite.accepted_at) return { valid: false as const, reason: "used" as const };
    if (new Date(invite.expires_at) < new Date()) return { valid: false as const, reason: "expired" as const };
    return { valid: true as const, email: invite.email };
  });

// ---------------- Public: accept invitation (creates user + profile) ----------------

const profileSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(72),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Solo letras, números, punto, guion y guion bajo"),
  fullName: z.string().min(2).max(120),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["female", "male", "non_binary", "other", "prefer_not_to_say"]),
  idDocument: z
    .string()
    .min(5)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Formato no válido"),
  ludoyaUsername: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-zA-Z0-9_.-]+$/)
    .nullable()
    .optional(),
});

export const acceptInvitation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data }) => {
    const tokenHash = hashToken(data.token);

    // Validate invitation
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("invitations")
      .select("id, email, expires_at, accepted_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (inviteErr) throw new Error(inviteErr.message);
    if (!invite) throw new Error("Invitación no encontrada");
    if (invite.revoked_at) throw new Error("La invitación ha sido revocada");
    if (invite.accepted_at) throw new Error("Esta invitación ya se ha utilizado");
    if (new Date(invite.expires_at) < new Date()) throw new Error("La invitación ha caducado");

    // Username uniqueness
    const { data: existingUsername } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .maybeSingle();
    if (existingUsername) throw new Error("Ese nombre de usuario ya está en uso");

    // Encrypt DNI
    const { data: enc, error: encErr } = await supabaseAdmin.rpc("encrypt_id_document", {
      _plain: data.idDocument,
    });
    if (encErr || !enc || !Array.isArray(enc) || enc.length === 0) {
      throw new Error("Error cifrando el documento de identidad");
    }
    const { ciphertext, nonce } = enc[0] as { ciphertext: string; nonce: string };

    // Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username, full_name: data.fullName },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Error creando el usuario");
    const userId = created.user.id;

    // Optional Ludoya link: validate username against Ludoya before inserting
    let ludoyaUsername: string | null = null;
    if (data.ludoyaUsername) {
      try {
        const { findLudoyaUserByUsername } = await import("@/lib/ludoya.server");
        const ludoyaUser = await findLudoyaUserByUsername(data.ludoyaUsername);
        if (!ludoyaUser) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          throw new Error("El usuario de Ludoya indicado no existe");
        }
        ludoyaUsername = ludoyaUser.username;
      } catch (err) {
        console.warn("Ludoya validation failed:", err instanceof Error ? err.message : err);
      }
    }

    // Insert profile (admin client bypasses RLS)
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username: data.username,
      full_name: data.fullName,
      avatar_url: data.avatarUrl ?? null,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      id_document_encrypted: ciphertext,
      id_document_nonce: nonce,
      ludoya_username: ludoyaUsername,
    });
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Error guardando el perfil: ${profileErr.message}`);
    }

    // Assign user role
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "user" });
    if (roleErr) {
      console.error("Error asignando rol:", roleErr.message);
    }

    // Fire-and-forget: invite the Ludoya user to the KLEFF group
    let ludoyaInvite: { status: string; httpStatus: number } | null = null;
    if (ludoyaUsername) {
      try {
        const { inviteToKleffGroup } = await import("@/lib/ludoya.server");
        const r = await inviteToKleffGroup(ludoyaUsername);
        ludoyaInvite = { status: r.status, httpStatus: r.httpStatus };
      } catch (err) {
        console.warn("Ludoya invite failed:", err instanceof Error ? err.message : err);
      }
    }

    // Mark invitation accepted
    await supabaseAdmin
      .from("invitations")
      .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq("id", invite.id);

    return { success: true, email: invite.email, ludoyaLinked: !!ludoyaUsername, ludoyaInvite };
  });

// ---------------- Admin: send invitation ----------------

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().email().max(255).toLowerCase(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    // Already a user with this email?
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const exists = usersList?.users.some((u) => u.email?.toLowerCase() === data.email);
    if (exists) throw new Error("Ya existe un usuario con ese correo");

    // Pending invitation?
    const { data: pending } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("email", data.email)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (pending) throw new Error("Ya existe una invitación pendiente para ese correo");

    const { raw, hash } = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabaseAdmin.from("invitations").insert({
      email: data.email,
      token_hash: hash,
      invited_by: context.userId,
      expires_at: expiresAt,
    });
    if (insertErr) throw new Error(insertErr.message);

    // Build invitation URL — always use production kleff.es domain
    const origin = process.env.SITE_URL || "https://www.kleff.es";
    const inviteUrl = `${origin}/invite/${raw}`;

    // Send invitation email via Resend (fire-and-forget)
    const { subject, html } = invitationEmail({ inviteUrl, expiresAt });
    const emailResult = await sendEmailSafe({
      to: data.email,
      subject,
      html,
      tags: [{ name: "type", value: "invitation" }],
    });

    return { success: true, inviteUrl, email: data.email, emailSent: !!emailResult };
  });

// ---------------- Admin: list invitations ----------------

export const listInvitations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select("id, email, expires_at, accepted_at, revoked_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { invitations: data ?? [] };
  });

// ---------------- Admin: revoke invitation ----------------

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .is("accepted_at", null);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Admin: list users with profile + role ----------------

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, member_number, username, full_name, avatar_url, date_of_birth, gender, created_at, ludoya_username, dues_paid, dues_paid_at, dues_paid_by")
      .order("member_number", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });

    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const emailMap = new Map<string, string>();
    (usersList?.users ?? []).forEach((u) => {
      if (u.email) emailMap.set(u.id, u.email);
    });

    return {
      users: (profiles ?? []).map((p) => ({
        ...p,
        email: emailMap.get(p.id) ?? null,
        roles: roleMap.get(p.id) ?? [],
      })),
    };
  });

// ---------------- Admin: toggle dues paid ----------------

export const setMemberDuesPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), paid: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        dues_paid: data.paid,
        dues_paid_at: data.paid ? new Date().toISOString() : null,
        dues_paid_by: data.paid ? context.userId : null,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ---------------- Admin: get DNI of a user ----------------

export const getUserIdDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Use the authenticated client so the audit log records auth.uid() correctly
    const { data: result, error } = await context.supabase.rpc("get_id_document", {
      _target_user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    return { idDocument: result as string | null };
  });
