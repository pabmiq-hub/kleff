import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Home, User, IdCard, Dices, LogOut, Shield, Gamepad2, Users } from "lucide-react";
import { NotificationsBell } from "@/components/app/NotificationsBell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Zona privada — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!session) {
    void navigate({ to: "/login", search: { redirect: window.location.pathname } });
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col md:flex-row">
      <aside className="md:w-64 bg-card border-b-2 md:border-b-0 md:border-r-2 border-ink p-4 md:p-6 flex md:flex-col gap-2 md:min-h-screen">
        <Link to="/app" className="font-display font-bold text-xl tracking-tight mb-0 md:mb-6">
          KLEFF <span className="text-coral-deep text-sm font-sans font-semibold">socios</span>
        </Link>
        <nav className="flex md:flex-col gap-1 flex-1 ml-auto md:ml-0">
          <NavLink to="/app" icon={<Home className="h-4 w-4" />} label="Inicio" exact />
          <NavLink to="/app/profile" icon={<User className="h-4 w-4" />} label="Mi perfil" />
          <NavLink to="/app/carnet" icon={<IdCard className="h-4 w-4" />} label="Mi carnet" />
          <NavLink to="/app/kleffers" icon={<Users className="h-4 w-4" />} label="Kleffers" />
          <NavLink to="/app/partidas" icon={<Gamepad2 className="h-4 w-4" />} label="Partidas" />
          <NavLink to="/app/rentals" icon={<Dices className="h-4 w-4" />} label="Alquilar" />
          <NavLink to="/app/rentals/mine" icon={<Dices className="h-4 w-4" />} label="Mis alquileres" />
        </nav>
        <div className="md:mt-auto">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" /> <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-5xl w-full">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            {isSuperAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-sm bg-ink text-cream rounded-lg px-3 py-2 w-fit hover:bg-ink/90"
              >
                <Shield className="h-4 w-4" /> Eres super admin · ir al panel de administración
              </Link>
            )}
          </div>
          <NotificationsBell />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-primary-soft/40 text-coral-deep" }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-soft/30 transition-colors"
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
