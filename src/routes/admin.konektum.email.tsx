import { createFileRoute } from "@tanstack/react-router";
import { DashboardEmail } from "@/konektum/components/admin/DashboardEmail";
import { UpgradePrompt } from "@/konektum/components/UpgradePrompt";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/email")({
  component: Page,
});

function Page() {
  const { hasFeature, isSuperAdmin } = useAdminData();
  if (!hasFeature("auto_emails") && !isSuperAdmin) {
    return (
      <UpgradePrompt
        title="Gestión de email avanzada"
        description="Configura tu dominio propio y envía emails personalizados desde tu marca"
        onUpgrade={() => window.open("/#pricing", "_blank")}
      />
    );
  }
  return <DashboardEmail />;
}
