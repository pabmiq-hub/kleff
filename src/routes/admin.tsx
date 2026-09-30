import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { AdminNavGroups, AdminSectionTabs, type NavGroup } from "@/components/admin/AdminNav";
import {
  LayoutDashboard,
  Users,
  Dices,
  FileText,
  ClipboardList,
  LogOut,
  Shield,
  ExternalLink,
  Vote,
  Heart,
  Euro,
  KeyRound,
  Menu,
  X,
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
  const { session, loading, user, signOut, isSuperAdmin: authSuperAdmin } = useAuth();
  const { access, loading: accessLoading, can, isSuperAdmin } = useAdminAccess();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const wideContent = pathname.startsWith("/admin/registrations/");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading || (session && accessLoading)) {
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

  const hasAnyAccess = isSuperAdmin || authSuperAdmin || Boolean(access?.activo && access.permisos.length > 0);
  if (!hasAnyAccess) {
    void navigate({ to: "/app" });
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: "/super-admin" });
  };

  const sa = isSuperAdmin;
  const groups: NavGroup[] = [
    {
      title: "General",
      items: [{ label: "Resumen", to: "/admin", exact: true, icon: <LayoutDashboard className="h-4 w-4" />, show: sa }],
    },
    {
      title: "Actividades",
      items: [
        { label: "Inscripciones", to: "/admin/registrations", icon: <ClipboardList className="h-4 w-4" />, show: sa || can("inscripcion") },
        { label: "Konektum", to: "/admin/konektum", icon: <Heart className="h-4 w-4" />, show: can("konektum") },
        { label: "Alquiler", to: "/admin/rentals", icon: <Dices className="h-4 w-4" />, show: sa },
      ],
    },
    {
      title: "Comunidad",
      items: [
        { label: "Socios", to: "/admin/members", match: ["/admin/members", "/admin/invitations"], icon: <Users className="h-4 w-4" />, show: sa },
        { label: "Participación", to: "/admin/polls", match: ["/admin/polls", "/admin/karma"], icon: <Vote className="h-4 w-4" />, show: sa },
      ],
    },
    {
      title: "Web",
      items: [
        {
          label: "Contenido",
          to: sa ? "/admin/content" : "/admin/blog",
          match: ["/admin/content", "/admin/blog", "/admin/media", "/admin/team"],
          icon: <FileText className="h-4 w-4" />,
          show: sa || can("blog"),
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        { label: "Finanzas", to: "/admin/finanzas", icon: <Euro className="h-4 w-4" />, show: can("finanzas") },
        { label: "Usuarios y permisos", to: "/admin/usuarios", icon: <KeyRound className="h-4 w-4" />, show: sa },
      ],
    },
  ];

  const footer = (
    <div className="space-y-1 border-t border-ink/10 pt-3">
      <Link
        to="/app"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Ir a zona socio
      </Link>
      <div className="px-3 text-xs text-ink/50 truncate">{user?.email}</div>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-ink hover:text-ink hover:bg-ink/10">
        <LogOut className="h-4 w-4 mr-2" /> Salir
      </Button>
    </div>
  );

  const brand = (
    <Link to="/admin" className="font-display font-bold text-xl tracking-tight text-ink">
      KLEFF{" "}
      <span className="text-coral text-xs font-sans font-semibold inline-flex items-center gap-1">
        <Shield className="h-3 w-3" /> ADMIN
      </span>
    </Link>
  );

  return (
    <div className="h-screen bg-cream text-ink flex flex-col md:flex-row overflow-hidden">
      <aside className="hidden md:flex md:w-64 md:shrink-0 bg-cream-deep border-r border-ink/10 p-6 flex-col gap-6 h-screen overflow-y-auto">
        {brand}
        <div className="flex-1">
          <AdminNavGroups groups={groups} />
        </div>
        {footer}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85%] h-full bg-cream-deep p-5 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              {brand}
              <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-ink/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">
              <AdminNavGroups groups={groups} onNavigate={() => setMobileOpen(false)} />
            </div>
            {footer}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-between md:justify-end gap-2 px-4 md:px-8 py-3 bg-cream/90 backdrop-blur border-b border-ink/10">
          <div className="flex items-center gap-2 md:hidden">
            <button aria-label="Abrir menú" onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-ink/10">
              <Menu className="h-5 w-5" />
            </button>
            {brand}
          </div>
          <NotificationsBell />
        </div>
        <div className={`w-full p-4 md:p-8 ${wideContent ? "" : "max-w-6xl"}`}>
          <AdminSectionTabs isSuperAdmin={sa} can={can} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
