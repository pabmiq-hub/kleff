import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";

export function MMAdminGate({ children, back }: { children: ReactNode; back?: { to: string; params?: Record<string, string>; label: string } }) {
  const { loading, session, isSuperAdmin } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-cream text-ink/70">Cargando…</div>;
  if (!session || !isSuperAdmin)
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-6 text-center text-ink">
        <div>
          <p className="text-lg font-semibold">Esta zona es solo para administradores.</p>
          <Link to="/super-admin" search={{ redirect: typeof window !== "undefined" ? window.location.pathname : "/actividades/juegos" } as any} className="mt-4 inline-block underline">
            Iniciar sesión
          </Link>
          <p className="mt-6 text-sm text-ink/60">
            ¿Eres jugador?{" "}
            <Link to="/actividades/juegos/jugar" className="underline">
              Introduce tu código
            </Link>
          </p>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {back ? (
            <Link to={back.to as any} params={back.params as any} className="flex items-center gap-1 text-sm text-ink/70 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> {back.label}
            </Link>
          ) : (
            <Link to="/admin" className="flex items-center gap-1 text-sm text-ink/70 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Administración
            </Link>
          )}
          <span className="ml-auto font-display text-lg font-bold">KLEFF · Juegos</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
    </div>
  );
}
