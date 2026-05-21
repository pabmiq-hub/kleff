import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/components/pages/ActivitiesPage";

export const Route = createFileRoute("/ca/activitats")({
  head: () => ({
    meta: [
      { title: "Activitats — Nits de jocs, tornejos i esdeveniments | KLEFF" },
      {
        name: "description",
        content:
          "Descobreix totes les activitats de KLEFF: la Nit de Jocs setmanal, tornejos mensuals, demostracions d'editorials, Slow Friending Lúdic, Game Nights especials i esdeveniments a mida a Barcelona.",
      },
      { property: "og:title", content: "Activitats — KLEFF" },
      {
        property: "og:description",
        content:
          "Nit de Jocs cada dimecres + tornejos, Slow Friending, edicions especials i esdeveniments a mida. Apunta't al pròxim a Meetup.",
      },
    ],
  }),
  component: ActivitiesPage,
});
