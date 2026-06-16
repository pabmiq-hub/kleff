import { createFileRoute } from "@tanstack/react-router";
import { ClocktowerPage } from "@/components/pages/ClocktowerPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/blood-on-the-clocktower")({
  loader: () => getPageContent({ data: { pageKey: "clocktower" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Blood on the Clocktower en KLEFF — Comunidad y partidas semanales en Barcelona" },
      {
        name: "description",
        content:
          "Una comunidad activa de Blood on the Clocktower en Barcelona: 3 partidas simultáneas cada semana en KLEFF, todos los niveles, en castellano e inglés. Únete al grupo de WhatsApp.",
      },
      { property: "og:title", content: "Blood on the Clocktower en KLEFF" },
      {
        property: "og:description",
        content:
          "Partidas semanales del juego de deducción social más adictivo, en KLEFF Barcelona. Todos los niveles, comunidad activa.",
      },
      { property: "og:url", content: "https://kleff.es/blood-on-the-clocktower" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/blood-on-the-clocktower" }],
  }),
  component: ClocktowerPage,
});
