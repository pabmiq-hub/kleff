import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";
import { getMeetupEvents } from "@/server/meetup.functions";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/ca/")({
  loader: async () => {
    const [meetup, pageContent] = await Promise.all([
      getMeetupEvents(),
      getPageContent({ data: { pageKey: "home", locale: "ca" } }),
    ]);
    return { ...meetup, pageContent };
  },
  staleTime: 15 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "KLEFF — Jocs de taula a Barcelona" },
      {
        name: "description",
        content:
          "La comunitat de jocs de taula més gran d'Europa. Game Nights cada setmana a l'Estació de França. +300 jocs, ambient inclusiu i multilingüe.",
      },
      { property: "og:title", content: "KLEFF — Jocs de taula a Barcelona" },
      { property: "og:description", content: "La comunitat de jocs de taula més gran d'Europa." },
    ],
  }),
  component: HomePage,
});
