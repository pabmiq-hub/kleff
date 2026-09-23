import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";
import { db, getAdminAccess, type AdminAccess, type Nivel, type Recurso } from "@/lib/permissions.server";

export type { AdminAccess, Nivel, Recurso };

export type AccessUser = {
  id: string;
  user_id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_ultima_conexion: string | null;
  permisos: { id: string; recurso: Recurso; nivel: Nivel | null; recurso_id: string | null }[];
};

/** Permisos del usuario que ha iniciado sesión (para pintar el menú del panel). */
export const getMyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccess> => getAdminAccess(context.userId));

export const adminListAccessUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessUser[]> => {
    await assertSuperAdmin(context.userId);
    const { data: usuarios, error } = await db
      .from("usuarios_acceso")
      .select("*")
      .order("fecha_creacion", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (usuarios ?? []).map((u: { id: string }) => u.id);
    let permisos: AccessUser["permisos"][number][] & { usuario_id: string }[] = [];
    if (ids.length) {
      const { data } = await db.from("permisos_usuario").select("*").in("usuario_id", ids);
      permisos = (data ?? []) as typeof permisos;
    }
    return (usuarios ?? []).map((u: AccessUser) => ({
      ...u,
      permisos: permisos
        .filter((p) => (p as unknown as { usuario_id: string }).usuario_id === u.id)
        .map((p) => ({ id: p.id, recurso: p.recurso, nivel: p.nivel, recurso_id: p.recurso_id })),
    }));
  });

const permisoSchema = z.object({
  recurso: z.enum(["inscripcion", "finanzas", "konektum", "blog"]),
  nivel: z.enum(["lectura", "escritura", "completo"]).nullable().optional(),
  recurso_id: z.string().uuid().nullable().optional(),
});

export const adminCreateAccessUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        nombre: z.string().max(160).optional(),
        password: z.string().min(8).max(72),
        permisos: z.array(permisoSchema).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    const email = data.email.trim().toLowerCase();
    let userId: string | null = null;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr) {
      // Puede existir ya en el sistema de autenticación: lo reutilizamos.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!found) throw new Error(createErr.message);
      userId = found.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password });
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("No se pudo crear la cuenta de acceso");

    const { data: usuario, error } = await db
      .from("usuarios_acceso")
      .upsert({ user_id: userId, email, nombre: data.nombre ?? null, activo: true }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.permisos.length) {
      const rows = data.permisos.map((p) => ({
        usuario_id: usuario.id,
        recurso: p.recurso,
        nivel: p.nivel ?? (p.recurso === "finanzas" ? "lectura" : "completo"),
        recurso_id: p.recurso_id ?? null,
      }));
      const { error: permErr } = await db.from("permisos_usuario").insert(rows);
      if (permErr) throw new Error(permErr.message);
    }
    return { id: usuario.id as string, user_id: userId };
  });

export const adminSetAccessUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), activo: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await db.from("usuarios_acceso").update({ activo: data.activo }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetAccessUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: usuario, error } = await db
      .from("usuarios_acceso")
      .select("user_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(usuario.user_id, {
      password: data.password,
    });
    if (authErr) throw new Error(authErr.message);
    return { ok: true };
  });

export const adminSetUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), permisos: z.array(permisoSchema) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error: delErr } = await db.from("permisos_usuario").delete().eq("usuario_id", data.id);
    if (delErr) throw new Error(delErr.message);
    if (data.permisos.length) {
      const rows = data.permisos.map((p) => ({
        usuario_id: data.id,
        recurso: p.recurso,
        nivel: p.nivel ?? (p.recurso === "finanzas" ? "lectura" : "completo"),
        recurso_id: p.recurso_id ?? null,
      }));
      const { error } = await db.from("permisos_usuario").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteAccessUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { error } = await db.from("usuarios_acceso").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Inscripciones disponibles para asignar permisos. */
export const adminListRegistrationOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const { data, error } = await db
      .from("registration_forms")
      .select("id, title, slug")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as { id: string; title: string; slug: string }[];
  });
