import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import {
  LayoutDashboard,
  Users,
  Mail,
  Dices,
  FileText,
  Newspaper,
  ClipboardList,
  LogOut,
  Shield,
  ExternalLink,
  UserCircle2,
  Sparkles,
  Vote,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { session, loading, isSuperAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-ink">
        <p className="text-ink/70">Cargando…</p>
      </div>
    );
  }

  if (!session) {
    void navigate({ to: "/super-admin", search: { redirect: window.location.pathname } });
    return null;
  }

  if (!isSuperAdmin) {
    void navigate({ to: "/app" });
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/super-admin" });
  };

  return (
    <div className="h-screen bg-cream text-ink flex flex-col md:flex-row overflow-hidden">
      <aside className="md:w-64 md:shrink-0 bg-cream-deep border-b-2 md:border-b-0 md:border-r border-ink/10 p-4 md:p-6 flex md:flex-col gap-2 md:h-screen z-30 md:overflow-y-auto">
        <Link to="/admin" className="font-display font-bold text-xl tracking-tight mb-0 md:mb-6 text-ink">
          KLEFF{" "}
          <span className="text-coral text-xs font-sans font-semibold inline-flex items-center gap-1">
            <Shield className="h-3 w-3" /> ADMIN
          </span>
        </Link>
        <nav className="flex md:flex-col gap-1 flex-1 ml-auto md:ml-0">
          <AdminNavLink to="/admin" exact icon={<LayoutDashboard className="h-4 w-4" />} label="Resumen" />
          <AdminNavLink to="/admin/members" icon={<Users className="h-4 w-4" />} label="Socios" />
          <AdminNavLink to="/admin/invitations" icon={<Mail className="h-4 w-4" />} label="Invitaciones" />
          <AdminNavLink to="/admin/rentals" icon={<Dices className="h-4 w-4" />} label="Alquiler" />
          <AdminNavLink to="/admin/content" icon={<FileText className="h-4 w-4" />} label="Contenido" />
          <AdminNavLink to="/admin/registrations" icon={<ClipboardList className="h-4 w-4" />} label="Inscripciones" />
          <AdminNavLink to="/admin/blog" icon={<Newspaper className="h-4 w-4" />} label="Blog" />
          <AdminNavLink to="/admin/media" icon={<Newspaper className="h-4 w-4" />} label="Medios" />
          <AdminNavLink to="/admin/team" icon={<UserCircle2 className="h-4 w-4" />} label="Equipo" />
          <AdminNavLink to="/admin/polls" icon={<Vote className="h-4 w-4" />} label="Votaciones" />
          <AdminNavLink to="/admin/karma" icon={<Sparkles className="h-4 w-4" />} label="Karma" />

        </nav>
        <div className="md:mt-auto space-y-1">
          <Link
            to="/app"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Ir a zona socio</span>
          </Link>
          <div className="hidden md:block px-3 pt-2 text-xs text-ink/50 border-t border-ink/10">
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full text-ink hover:text-ink hover:bg-ink/10">
            <LogOut className="h-4 w-4 mr-2" /> <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-end gap-2 px-4 md:px-8 py-3 bg-cream/90 backdrop-blur border-b border-ink/10">
          <NotificationsBell />
        </div>
        <div className="max-w-6xl w-full p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-coral text-ink" }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink/80 hover:bg-ink/10 transition-colors"
    >
      {icon} <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
