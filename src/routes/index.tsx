import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KLEFF — Juegos de mesa en Barcelona" },
      {
        name: "description",
        content:
          "La comunidad de juegos de mesa más grande de Europa. Game Nights cada semana en l'Estació de França. +300 juegos, ambiente inclusivo y multilingüe.",
      },
      { property: "og:title", content: "KLEFF — Juegos de mesa en Barcelona" },
      {
        property: "og:description",
        content: "La comunidad de juegos de mesa más grande de Europa. Únete a nuestras Game Nights cada semana.",
      },
    ],
  }),
  component: HomePage,
});
