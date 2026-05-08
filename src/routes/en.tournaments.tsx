import { createFileRoute } from "@tanstack/react-router";
import { TournamentsPage } from "@/components/pages/TournamentsPage";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/en/tournaments")({
  loader: () => getPageContent({ data: { pageKey: "tournaments", locale: "en" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Tournaments at KLEFF — Active community with tournaments almost every week in Barcelona" },
      {
        name: "description",
        content:
          "Tournaments community at KLEFF Barcelona: multiple tournaments per month, 1vs1, swiss and qualifier formats. Free or prize-pool entry fees.",
      },
      { property: "og:title", content: "Tournaments at KLEFF" },
      {
        property: "og:description",
        content:
          "Multiple monthly tournaments at KLEFF: free or with entry fee that goes straight to prizes. Join our WhatsApp group.",
      },
    ],
  }),
  component: TournamentsPage,
});
