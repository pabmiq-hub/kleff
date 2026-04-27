import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Quiénes somos — KLEFF" },
      {
        name: "description",
        content:
          "La historia de KLEFF: de una crisis personal en 2018 a la comunidad de juegos de mesa más grande de Barcelona.",
      },
      { property: "og:title", content: "Quiénes somos — KLEFF" },
      {
        property: "og:description",
        content: "Seis años, un propósito: convertir mesas en puntos de encuentro.",
      },
    ],
  }),
  component: AboutPage,
});
