import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export const Route = createFileRoute("/admin/finanzas")({
  head: () => ({
    meta: [{ title: "Finanzas — Admin KLEFF" }, { name: "robots", content: "noindex" }],
  }),
  component: FinanzasLayout,
});

function FinanzasLayout() {
  const { can, loading, canFinanzasWrite } = useAdminAccess();
  const navigate = useNavigate();

  if (loading) return <p className="text-ink/60">Cargando…</p>;
  if (!can("finanzas")) {
    void navigate({ to: "/admin" });
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Finanzas</h1>
          <p className="text-ink/60 mt-1">Ingresos, gastos, cuotas e impuestos de la asociación.</p>
        </div>
        {!canFinanzasWrite && (
          <span className="text-xs font-semibold rounded-full bg-ink/10 px-3 py-1 text-ink/70">
            Solo lectura
          </span>
        )}
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-ink/15">
        <TabLink to="/admin/finanzas" exact label="Dashboard" />
        <TabLink to="/admin/finanzas/cuotas" label="Cuotas de socios" />
        <TabLink to="/admin/finanzas/aportaciones" label="Aportaciones" />
        <TabLink to="/admin/finanzas/facturas" label="Facturas" />
        <TabLink to="/admin/finanzas/gastos" label="Gastos" />
        <TabLink to="/admin/finanzas/impuestos" label="Impuestos" />
        <TabLink to="/admin/finanzas/colaboraciones" label="Colaboraciones" />
        <TabLink to="/admin/finanzas/categorias" label="Categorías" />
      </nav>
      <Outlet />
    </div>
  );
}

function TabLink({ to, label, exact }: { to: string; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "border-coral text-ink" }}
      className="px-4 py-2 text-sm font-semibold text-ink/60 border-b-2 border-transparent hover:text-ink hover:border-ink/30 -mb-px"
    >
      {label}
    </Link>
  );
}
