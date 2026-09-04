// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import RepeatResponse from "@/konektum/pages/RepeatResponse";

export const Route = createFileRoute("/repeat-response")({
  head: () => ({
    meta: [
      { title: "Responder repetición · KLEFF" },
      { name: "description", content: "Responde a una petición de repetir mesa en tu evento." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Responder repetición · KLEFF" },
      { property: "og:description", content: "Responde a una petición de repetir mesa en tu evento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RepeatResponse,
});
