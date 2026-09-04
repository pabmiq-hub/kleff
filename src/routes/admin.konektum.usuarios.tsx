import { createFileRoute } from "@tanstack/react-router";
import { DashboardUsers } from "@/konektum/components/admin/DashboardUsers";
import { UpgradePrompt } from "@/konektum/components/UpgradePrompt";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/usuarios")({
  component: Page,
});

function Page() {
  const { hasFeature, isSuperAdmin } = useAdminData();
  if (!hasFeature("crm") && !isSuperAdmin) {
    return (
      <UpgradePrompt
        title="CRM de Usuarios"
        description="Gestiona tu base de datos de participantes, detecta duplicados y envía campañas de remarketing"
        onUpgrade={() => window.open("/#pricing", "_blank")}
      />
    );
  }
  return <DashboardUsers />;
}
