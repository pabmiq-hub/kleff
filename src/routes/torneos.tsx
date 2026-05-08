import { createFileRoute } from "@tanstack/react-router";
import { TournamentsPage } from "@/components/pages/TournamentsPage";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/torneos")({
  loader: () => getPageContent({ data: { pageKey: "tournaments" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Torneos en KLEFF — Comunidad con torneos casi cada semana en Barcelona" },
      {
        name: "description",
        content:
          "Comunidad de Torneos en KLEFF Barcelona: varios torneos al mes con formatos 1vs1, suizo y clasificatorios. Inscripciones gratuitas o destinadas a premios.",
      },
      { property: "og:title", content: "Torneos en KLEFF" },
      {
        property: "og:description",
        content:
          "Varios torneos al mes en KLEFF: gratis o con cuota destinada a premios. Únete al grupo de WhatsApp.",
      },
    ],
  }),
  component: TournamentsPage,
});
