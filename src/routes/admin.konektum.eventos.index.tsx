import { createFileRoute } from "@tanstack/react-router";
import { DashboardEvents } from "@/konektum/components/admin/DashboardEvents";
import { useAdminData } from "@/konektum/AdminData";

export const Route = createFileRoute("/admin/konektum/eventos/")({
  component: Page,
});

function Page() {
  const { events, isPro, deleteEvent } = useAdminData();
  return <DashboardEvents events={events} isPro={isPro} onDeleteEvent={deleteEvent} />;
}
