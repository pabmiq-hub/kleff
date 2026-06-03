import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";
import { getMeetupEvents } from "@/server/meetup.functions";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/en/")({
  loader: async () => {
    const [meetup, pageContent] = await Promise.all([
      getMeetupEvents(),
      getPageContent({ data: { pageKey: "home", locale: "en" } }),
    ]);
    return { ...meetup, pageContent };
  },
  staleTime: 15 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "KLEFF — Board games in Barcelona" },
      {
        name: "description",
        content:
          "Europe's largest board game community. Game Nights every week at l'Estació de França. 300+ games, inclusive and multilingual atmosphere.",
      },
      { property: "og:title", content: "KLEFF — Board games in Barcelona" },
      { property: "og:description", content: "Europe's largest board game community. Join our weekly Game Nights." },
    ],
  }),
  component: HomePage,
});
