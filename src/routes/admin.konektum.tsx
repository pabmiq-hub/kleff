import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Home, Calendar, BarChart3, UsersRound, Mail, FileText, Settings } from "lucide-react";
import { TooltipProvider } from "@/konektum/ui/tooltip";
import { Toaster } from "@/konektum/ui/toaster";
import { AdminDataProvider, useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum")({
  head: () => ({
    meta: [
      { title: "Konektum — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KonektumLayout,
});

const SECTIONS = [
  { to: "/admin/konektum", label: "Inicio", icon: Home, exact: true },
  { to: "/admin/konektum/eventos", label: "Eventos", icon: Calendar },
  { to: "/admin/konektum/analitica", label: "Analítica", icon: BarChart3 },
  { to: "/admin/konektum/usuarios", label: "Usuarios", icon: UsersRound },
  { to: "/admin/konektum/email", label: "Email", icon: Mail },
  { to: "/admin/konektum/plantillas", label: "Plantillas", icon: FileText },
  { to: "/admin/konektum/configuracion", label: "Configuración", icon: Settings },
] as const;

function KonektumLayout() {
  return (
    <TooltipProvider>
      <AdminDataProvider>
        <div className="space-y-6">
          <TopNav />
          <Outlet />
        </div>
      </AdminDataProvider>
      <Toaster />
    </TooltipProvider>
  );
}

function TopNav() {
  const { organizer, user } = useAdminData();
  return (
    <header className="space-y-2">
      <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2 -mx-1 px-1 scrollbar-hide">
        {SECTIONS.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: "exact" in rest ? rest.exact : false }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-muted-foreground truncate">
        {organizer?.company_name || user?.email}
      </p>
    </header>
  );
}
