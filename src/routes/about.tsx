import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Quiénes somos — KLEFF" },
      {
        name: "description",
        content:
          "Conoce a KLEFF: nuestra historia, valores, equipo, comunidades de juego y colaboradores. La comunidad de juegos de mesa más grande de Europa.",
      },
      { property: "og:title", content: "Quiénes somos — KLEFF" },
      {
        property: "og:description",
        content: "Nuestra historia, valores y el equipo detrás de KLEFF.",
      },
    ],
  }),
  component: AboutPage,
});
