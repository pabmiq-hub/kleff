import { createFileRoute } from "@tanstack/react-router";
import EventDetail from "@/konektum/pages/EventDetail";

export const Route = createFileRoute("/admin/konektum/eventos/$id")({
  head: () => ({
    meta: [
      { title: "Evento de Konektum — KLEFF" },
      { name: "description", content: "Gestión de participantes y mesas de un evento de Konektum en KLEFF." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Evento de Konektum — KLEFF" },
      { property: "og:description", content: "Gestión de participantes y mesas de un evento de Konektum en KLEFF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventDetail,
});
