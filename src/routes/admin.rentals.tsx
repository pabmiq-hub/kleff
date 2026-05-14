import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/rentals")({
  component: RentalsLayout,
});

function RentalsLayout() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Alquiler de juegos</h1>
        <p className="text-cream/60 mt-1">Gestión completa del sistema de alquiler.</p>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-cream/15">
        <TabLink to="/admin/rentals" exact label="Solicitudes" />
        <TabLink to="/admin/rentals/active" label="Activos" />
        <TabLink to="/admin/rentals/catalog" label="Catálogo" />
        <TabLink to="/admin/rentals/history" label="Histórico" />
        <TabLink to="/admin/rentals/settings" label="Ajustes" />
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
      activeProps={{ className: "border-coral text-cream" }}
      className="px-4 py-2 text-sm font-semibold text-cream/60 border-b-2 border-transparent hover:text-cream hover:border-cream/30 -mb-px"
    >
      {label}
    </Link>
  );
}
