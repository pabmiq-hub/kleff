import { createFileRoute } from "@tanstack/react-router";
import { ClocktowerPage } from "@/components/pages/ClocktowerPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/en/blood-on-the-clocktower")({
  loader: () => getPageContent({ data: { pageKey: "clocktower", locale: "en" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Blood on the Clocktower at KLEFF — Weekly games and active community in Barcelona" },
      {
        name: "description",
        content:
          "An active Blood on the Clocktower community in Barcelona: 3 simultaneous games every week at KLEFF, all skill levels, Spanish and English. Join our WhatsApp group.",
      },
      { property: "og:title", content: "Blood on the Clocktower at KLEFF" },
      {
        property: "og:description",
        content:
          "Weekly games of the most addictive social deduction game, at KLEFF Barcelona. All levels, active community.",
      },
    ],
  }),
  component: ClocktowerPage,
});
