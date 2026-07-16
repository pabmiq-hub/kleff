import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { IdCard, Dices, ListChecks, Gamepad2 } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Hola 👋</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickCard to="/app/carnet" icon={<IdCard className="h-5 w-5" />} title="Mi carnet" desc="Tu carnet digital de socio." />
        <QuickCard to="/app/partidas" icon={<Gamepad2 className="h-5 w-5" />} title="Partidas" desc="Eventos del grupo de KLEFF en Ludoya." />
        <QuickCard to="/app/rentals" icon={<Dices className="h-5 w-5" />} title="Alquilar juegos" desc="Explora el catálogo y solicita un alquiler." />
        <QuickCard to="/app/rentals/mine" icon={<ListChecks className="h-5 w-5" />} title="Mis alquileres" desc="Solicitudes activas e histórico." />
      </div>
    </div>
  );
}

function QuickCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm hover:shadow-tactile transition-shadow">
      <div className="flex items-center gap-2 text-coral-deep font-semibold">
        {icon} {title}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </Link>
  );
}
