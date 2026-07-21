import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/rentals")({
  component: RentalsLayout,
});

function RentalsLayout() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Alquiler de juegos</h1>
        <p className="text-muted-foreground mt-1">Catálogo, solicitudes y devoluciones.</p>
      </header>
      <nav className="flex flex-wrap gap-1 border-b border-ink/15">
        <TabLink to="/app/rentals" exact label="Catálogo" />
        <TabLink to="/app/rentals/mine" label="Mis alquileres" />
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
