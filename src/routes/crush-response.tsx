// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import CrushResponse from "@/konektum/pages/CrushResponse";

export const Route = createFileRoute("/crush-response")({
  head: () => ({
    meta: [
      { title: "Responder crush · KLEFF" },
      { name: "description", content: "Responde a una petición de crush de tu evento." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Responder crush · KLEFF" },
      { property: "og:description", content: "Responde a una petición de crush de tu evento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrushResponse,
});
