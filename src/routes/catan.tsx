import { createFileRoute } from "@tanstack/react-router";
import { CatanPage } from "@/components/pages/CatanPage";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/catan")({
  loader: () => getPageContent({ data: { pageKey: "catan" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Catan en KLEFF — Comunidad activa, torneos mensuales en Barcelona" },
      {
        name: "description",
        content:
          "Comunidad de Catan en KLEFF Barcelona: más de 250 miembros, torneos cada mes y partidas semanales. Únete al grupo de WhatsApp.",
      },
      { property: "og:title", content: "Catan en KLEFF" },
      {
        property: "og:description",
        content:
          "Más de 250 jugadores, torneos cada mes y partidas semanales del clásico moderno. Únete a la comunidad de Catan en KLEFF.",
      },
    ],
  }),
  component: CatanPage,
});
