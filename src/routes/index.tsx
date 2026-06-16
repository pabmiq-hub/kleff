import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";
import { getMeetupEvents } from "@/lib/meetup.functions";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [meetup, pageContent] = await Promise.all([
      getMeetupEvents(),
      getPageContent({ data: { pageKey: "home" } }),
    ]);
    return { ...meetup, pageContent };
  },
  staleTime: 15 * 60 * 1000,
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
      { property: "og:url", content: "https://kleff.es/" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/" }],
  }),
  component: HomePage,
});
