import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { HowItWorksPage } from "@/components/pages/HowItWorksPage";

export const Route = createFileRoute("/en/how-it-works")({
  loader: () => getPageContent({ data: { pageKey: "how", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "How it works — KLEFF" },
      {
        name: "description",
        content:
          "How KLEFF works: free activities, €4 minimum order, communities for Blood on the Clocktower, Catan, Unmatched and more. Become a member and unlock exclusive perks.",
      },
      { property: "og:title", content: "How it works — KLEFF" },
      {
        property: "og:description",
        content:
          "Come alone or with friends — the #TeamKLEFF helps you find a table. 300+ games waiting for you every week.",
      },
    ],
  }),
  component: HowItWorksPage,
});
