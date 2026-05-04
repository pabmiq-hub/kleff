import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/en/about")({
  loader: () => getPageContent({ data: { pageKey: "about" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "About — KLEFF" },
      { name: "description", content: "The KLEFF story: from a personal crisis in 2018 to Barcelona's biggest board game community." },
      { property: "og:title", content: "About — KLEFF" },
      { property: "og:description", content: "Six years, one purpose: turning tables into meeting points." },
    ],
  }),
  component: AboutPage,
});
