import { createFileRoute } from "@tanstack/react-router";
import { ActivitiesPage } from "@/components/pages/ActivitiesPage";

export const Route = createFileRoute("/en/activities")({
  head: () => ({
    meta: [
      { title: "Activities — Game nights, tournaments and events | KLEFF" },
      {
        name: "description",
        content:
          "Discover all KLEFF activities: weekly Game Night, monthly tournaments, publisher demos, Slow Friending, special themed Game Nights and bespoke events in Barcelona.",
      },
      { property: "og:title", content: "Activities — KLEFF" },
      {
        property: "og:description",
        content:
          "Game Night every Wednesday + tournaments, Slow Friending, special editions and bespoke events. RSVP to the next one on Meetup.",
      },
    ],
  }),
  component: ActivitiesPage,
});
