import { createFileRoute } from "@tanstack/react-router";
import CreateEvent from "@/konektum/pages/CreateEvent";

export const Route = createFileRoute("/admin/konektum/eventos/nuevo")({
  component: CreateEvent,
});
