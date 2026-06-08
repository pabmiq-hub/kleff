import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/components/pages/ActivitiesPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/actividades")({
  loader: () =>
    getPageContent({ data: { pageKey: "activities" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Actividades — Noches de juegos, torneos y eventos | KLEFF" },
      {
        name: "description",
        content:
          "Descubre todas las actividades de KLEFF: la Noche de Juegos semanal, torneos mensuales, demostraciones de editoriales, Slow Friending Lúdico, Game Nights especiales y eventos a medida en Barcelona.",
      },
      { property: "og:title", content: "Actividades — KLEFF" },
      {
        property: "og:description",
        content:
          "Noche de Juegos cada miércoles + torneos, Slow Friending, ediciones especiales y eventos a medida. Apúntate al próximo en Meetup.",
      },
    ],
  }),
  component: ActivitiesPage,
});
