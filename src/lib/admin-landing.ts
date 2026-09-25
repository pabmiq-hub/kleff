import type { AdminAccess } from "@/lib/permissions.server";

/** Primera pantalla del panel a la que puede entrar un usuario según sus permisos. */
export function adminLandingPath(access: AdminAccess | null): string | null {
  if (!access) return null;
  if (access.isSuperAdmin) return "/admin";
  if (!access.activo || access.permisos.length === 0) return null;
  const p = access.permisos;
  if (p.some((x) => x.recurso === "finanzas")) return "/admin/finanzas";
  const insc = p.find((x) => x.recurso === "inscripcion");
  if (insc) return insc.recurso_id ? `/admin/registrations/${insc.recurso_id}` : "/admin/registrations";
  if (p.some((x) => x.recurso === "konektum")) return "/admin/konektum";
  if (p.some((x) => x.recurso === "blog")) return "/admin/blog";
  return null;
}
