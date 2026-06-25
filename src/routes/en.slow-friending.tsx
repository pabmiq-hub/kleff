import { createFileRoute } from "@tanstack/react-router";
import { SlowFriendingPage } from "@/components/pages/SlowFriendingPage";

export const Route = createFileRoute("/en/slow-friending")({
  head: () => ({
    meta: [
      { title: "Slow Friending Lúdico — Meet people playing board games in Barcelona | KLEFF" },
      {
        name: "description",
        content:
          "Slow Friending Lúdico: rotating tables, social games and KONEKTUM, our app for friendship, romance and real connections. Events in Barcelona.",
      },
      { property: "og:title", content: "Slow Friending Lúdico — KLEFF Barcelona" },
      {
        property: "og:description",
        content:
          "More than games — real connections. 35-minute rounds, mixed tables and our own app so nothing gets lost when the night ends.",
      },
      { property: "og:url", content: "https://kleff.es/en/slow-friending" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/slow-friending" }],
  }),
  component: SlowFriendingPage,
});
