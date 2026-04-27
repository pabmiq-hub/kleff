import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/HomePage";

export const Route = createFileRoute("/en/")({
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
