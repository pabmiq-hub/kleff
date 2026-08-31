import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Home, CalendarDays, BarChart3, Users, Mail, LayoutTemplate, Settings } from "lucide-react";

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
  { to: "/admin/konektum/eventos", label: "Eventos", icon: CalendarDays },
  { to: "/admin/konektum/analitica", label: "Analítica", icon: BarChart3 },
  { to: "/admin/konektum/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/konektum/email", label: "Email", icon: Mail },
  { to: "/admin/konektum/plantillas", label: "Plantillas", icon: LayoutTemplate },
  { to: "/admin/konektum/configuracion", label: "Configuración", icon: Settings },
] as const;

function KonektumLayout() {
  return (
    <div className="space-y-6">
      <nav className="flex gap-1 overflow-x-auto border-b border-ink/10 pb-2 -mx-1 px-1">
        {SECTIONS.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: "exact" in rest ? rest.exact : false }}
            activeProps={{ className: "bg-coral text-ink" }}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/10 transition-colors"
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
