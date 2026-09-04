import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardHome } from "@/konektum/components/admin/DashboardHome";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/")({
  component: Page,
});

const SECTION_PATHS: Record<string, string> = {
  home: "/admin/konektum",
  events: "/admin/konektum/eventos",
  analytics: "/admin/konektum/analitica",
  users: "/admin/konektum/usuarios",
  email: "/admin/konektum/email",
  templates: "/admin/konektum/plantillas",
  settings: "/admin/konektum/configuracion",
};

function Page() {
  const { realEvents, stats, isPro, participants, organizer } = useAdminData();
  const navigate = useNavigate();
  return (
    <DashboardHome
      events={realEvents}
      stats={stats}
      isPro={isPro}
      participants={participants}
      companyName={organizer?.company_name ?? null}
      onNavigate={(section: string) => {
        void navigate({ to: SECTION_PATHS[section] ?? "/admin/konektum" });
      }}
    />
  );
}
