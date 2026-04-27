import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";
import { getOgPreviews } from "@/server/og.functions";
import { PRESS_LINKS } from "@/data/press";

export const Route = createFileRoute("/about")({
  loader: () => getOgPreviews({ data: { urls: PRESS_LINKS.map((p) => p.url) } }),
  staleTime: 24 * 60 * 60 * 1000,
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
