import { createFileRoute } from "@tanstack/react-router";
import EventDetail from "@/konektum/pages/EventDetail";

export const Route = createFileRoute("/admin/konektum/eventos/$id")({
  component: EventDetail,
});
