import { createFileRoute } from "@tanstack/react-router";
import { DashboardSettings } from "@/konektum/components/admin/DashboardSettings";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/configuracion")({
  component: Page,
});

function Page() {
  const { user, organizer, plan, limits, branding, refreshOrganizer } = useAdminData();
  return (
    <DashboardSettings
      user={user}
      organizer={organizer}
      plan={plan}
      limits={limits}
      branding={branding}
      onRefresh={refreshOrganizer}
    />
  );
}
