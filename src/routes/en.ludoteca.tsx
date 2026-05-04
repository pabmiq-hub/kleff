import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { LudotecaPage } from "@/components/pages/LudotecaPage";

export const Route = createFileRoute("/en/ludoteca")({
  loader: () => getPageContent({ data: { pageKey: "ludoteca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "KLEFF Library — Our board game collection" },
      {
        name: "description",
        content:
          "Browse the 100+ board games in KLEFF's library: filter by players, length, weight and mechanics. Synced with BoardGameGeek.",
      },
      { property: "og:title", content: "KLEFF Library" },
      { property: "og:description", content: "Over a hundred games waiting for you at KLEFF Barcelona." },
    ],
  }),
  component: LudotecaPage,
});
