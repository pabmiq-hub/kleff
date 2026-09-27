import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminAccess } from "@/lib/permissions.functions";
import { useAuth } from "@/auth/AuthProvider";
import type { AdminAccess, Nivel, Recurso } from "@/lib/permissions.server";

const EMPTY: AdminAccess = { isSuperAdmin: false, activo: false, permisos: [] };

export function useAdminAccess() {
  const fetchAccess = useServerFn(getMyAdminAccess);
  const { session, loading: authLoading, isSuperAdmin: authSuperAdmin } = useAuth();
  const userId = session?.user?.id ?? null;
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setAccess(EMPTY);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    (async () => {
      // Retry: the first call can race the auth header being attached.
      for (let attempt = 0; attempt < 4 && alive; attempt++) {
        try {
          const a = (await fetchAccess()) as AdminAccess;
          if (alive) setAccess(a);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }
      if (alive) setAccess({ ...EMPTY, isSuperAdmin: authSuperAdmin });
    })().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [fetchAccess, userId, authLoading, authSuperAdmin]);

  const can = useCallback(
    (recurso: Recurso, minNivel?: Nivel) => {
      if (!access) return false;
      if (access.isSuperAdmin) return true;
      if (!access.activo) return false;
      return access.permisos.some((p) => {
        if (p.recurso !== recurso) return false;
        if (minNivel === "escritura") return p.nivel === "escritura" || p.nivel === "completo";
        return true;
      });
    },
    [access],
  );

  const inscripcionIds = useMemo(
    () =>
      (access?.permisos ?? [])
        .filter((p) => p.recurso === "inscripcion" && p.recurso_id)
        .map((p) => p.recurso_id as string),
    [access],
  );

  return {
    access,
    loading,
    can,
    isSuperAdmin: access?.isSuperAdmin ?? false,
    canFinanzasWrite: can("finanzas", "escritura"),
    inscripcionIds,
  };
}
