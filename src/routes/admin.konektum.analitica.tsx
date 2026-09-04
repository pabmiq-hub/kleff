import { createFileRoute } from "@tanstack/react-router";
import { DashboardAnalytics } from "@/konektum/components/admin/DashboardAnalytics";
import { UpgradePrompt } from "@/konektum/components/UpgradePrompt";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/analitica")({
  component: Page,
});

function Page() {
  const { analyticsData, hasFeature, isSuperAdmin } = useAdminData();
  if (!hasFeature("analytics") && !isSuperAdmin) {
    return (
      <UpgradePrompt
        title="Analítica avanzada"
        description="Accede a estadísticas detalladas de tus eventos, participantes y matches"
        onUpgrade={() => window.open("/#pricing", "_blank")}
      />
    );
  }
  return <DashboardAnalytics data={analyticsData} />;
}
