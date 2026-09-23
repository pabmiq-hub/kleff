import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminAccess } from "@/lib/permissions.functions";
import type { AdminAccess, Nivel, Recurso } from "@/lib/permissions.server";

const EMPTY: AdminAccess = { isSuperAdmin: false, activo: false, permisos: [] };

export function useAdminAccess() {
  const fetchAccess = useServerFn(getMyAdminAccess);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchAccess()
      .then((a) => {
        if (alive) setAccess(a as AdminAccess);
      })
      .catch(() => {
        if (alive) setAccess(EMPTY);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetchAccess]);

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
