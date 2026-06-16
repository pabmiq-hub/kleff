import { createFileRoute } from "@tanstack/react-router";
import { CatanPage } from "@/components/pages/CatanPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/en/catan")({
  loader: () => getPageContent({ data: { pageKey: "catan", locale: "en" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Catan at KLEFF — Active community and monthly tournaments in Barcelona" },
      {
        name: "description",
        content:
          "Catan community at KLEFF Barcelona: 250+ members, monthly tournaments and weekly games. Join our WhatsApp group.",
      },
      { property: "og:title", content: "Catan at KLEFF" },
      {
        property: "og:description",
        content:
          "250+ players, monthly tournaments and weekly games of the modern classic. Join the Catan community at KLEFF.",
      },
      { property: "og:url", content: "https://kleff.es/en/catan" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/catan" }],
  }),
  component: CatanPage,
});
