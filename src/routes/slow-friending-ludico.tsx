import { createFileRoute } from "@tanstack/react-router";
import { SlowFriendingPage } from "@/components/pages/SlowFriendingPage";

export const Route = createFileRoute("/slow-friending-ludico")({
  head: () => ({
    meta: [
      { title: "Slow Friending Lúdico — Conoce gente jugando en Barcelona | KLEFF" },
      {
        name: "description",
        content:
          "Slow Friending Lúdico: rotación de mesas, juegos sociales y KONEKTUM, nuestra app para amistades, romance y conexiones reales. Eventos en Barcelona.",
      },
      { property: "og:title", content: "Slow Friending Lúdico — KLEFF Barcelona" },
      {
        property: "og:description",
        content:
          "Más que juegos, son conexiones. Rondas de 35 minutos, mesas mixtas y app propia para que nada se pierda al terminar la noche.",
      },
      { property: "og:url", content: "https://kleff.es/slow-friending-ludico" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/slow-friending-ludico" }],
  }),
  component: SlowFriendingPage,
});
