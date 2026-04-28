import { createFileRoute } from "@tanstack/react-router";
import { LudotecaPage } from "@/components/pages/LudotecaPage";

export const Route = createFileRoute("/ludoteca")({
  head: () => ({
    meta: [
      { title: "Ludoteca KLEFF — Nuestra colección de juegos de mesa" },
      {
        name: "description",
        content:
          "Explora los más de cien juegos de la ludoteca de KLEFF: filtra por jugadores, duración, dificultad y mecánicas. Sincronizado con BoardGameGeek.",
      },
      { property: "og:title", content: "Ludoteca KLEFF" },
      { property: "og:description", content: "Más de cien juegos para jugar en KLEFF Barcelona." },
    ],
  }),
  component: LudotecaPage,
});
