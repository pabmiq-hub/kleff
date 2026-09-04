import { createFileRoute } from "@tanstack/react-router";
import { DashboardTemplates } from "@/konektum/components/admin/DashboardTemplates";
import { UpgradePrompt } from "@/konektum/components/UpgradePrompt";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/plantillas")({
  component: Page,
});

function Page() {
  const { hasFeature, isSuperAdmin } = useAdminData();
  if (!hasFeature("templates") && !isSuperAdmin) {
    return (
      <UpgradePrompt
        title="Plantillas"
        description="Crea y gestiona plantillas reutilizables de formularios, correos electrónicos y eventos"
        onUpgrade={() => window.open("/#pricing", "_blank")}
      />
    );
  }
  return <DashboardTemplates />;
}
