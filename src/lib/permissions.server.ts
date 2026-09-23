import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Tablas de Finanzas / accesos que no están en los tipos generados
 * (viven en la base de datos propia de KLEFF).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabaseAdmin as any;

export type Recurso = "inscripcion" | "finanzas" | "konektum" | "blog";
export type Nivel = "lectura" | "escritura" | "completo";

export type PermisoRow = {
  id: string;
  recurso: Recurso;
  nivel: Nivel | null;
  recurso_id: string | null;
};

export type AdminAccess = {
  isSuperAdmin: boolean;
  activo: boolean;
  permisos: PermisoRow[];
};

export async function getAdminAccess(userId: string): Promise<AdminAccess> {
  const { data: role } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (role) return { isSuperAdmin: true, activo: true, permisos: [] };

  const { data: usuario } = await db
    .from("usuarios_acceso")
    .select("id, activo")
    .eq("user_id", userId)
    .maybeSingle();

  if (!usuario || !usuario.activo) return { isSuperAdmin: false, activo: false, permisos: [] };

  const { data: permisos } = await db
    .from("permisos_usuario")
    .select("id, recurso, nivel, recurso_id")
    .eq("usuario_id", usuario.id);

  return { isSuperAdmin: false, activo: true, permisos: (permisos ?? []) as PermisoRow[] };
}

export function hasPermission(
  access: AdminAccess,
  recurso: Recurso,
  opts?: { minNivel?: Nivel; recursoId?: string },
): boolean {
  if (access.isSuperAdmin) return true;
  if (!access.activo) return false;
  return access.permisos.some((p) => {
    if (p.recurso !== recurso) return false;
    if (opts?.recursoId && p.recurso_id && p.recurso_id !== opts.recursoId) return false;
    if (opts?.minNivel === "escritura") return p.nivel === "escritura" || p.nivel === "completo";
    return true;
  });
}

export async function assertPermission(
  userId: string,
  recurso: Recurso,
  opts?: { minNivel?: Nivel; recursoId?: string },
): Promise<AdminAccess> {
  const access = await getAdminAccess(userId);
  if (!hasPermission(access, recurso, opts)) {
    throw new Error("Forbidden: no tienes permiso para esta sección");
  }
  return access;
}

export const assertFinanzasRead = (userId: string) => assertPermission(userId, "finanzas");
export const assertFinanzasWrite = (userId: string) =>
  assertPermission(userId, "finanzas", { minNivel: "escritura" });

/** Inscripciones a las que el usuario tiene acceso ("all" para super admin). */
export async function allowedFormIds(userId: string): Promise<string[] | "all"> {
  const access = await getAdminAccess(userId);
  if (access.isSuperAdmin) return "all";
  if (!access.activo) throw new Error("Forbidden");
  const ids = access.permisos
    .filter((p) => p.recurso === "inscripcion" && p.recurso_id)
    .map((p) => p.recurso_id as string);
  if (!ids.length) throw new Error("Forbidden: sin acceso a inscripciones");
  return ids;
}

export async function assertFormAccess(userId: string, formId: string): Promise<void> {
  const ids = await allowedFormIds(userId);
  if (ids !== "all" && !ids.includes(formId)) {
    throw new Error("Forbidden: sin acceso a esta inscripción");
  }
}
