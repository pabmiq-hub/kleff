import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { BlogPage } from "@/components/pages/BlogPage";

export const Route = createFileRoute("/en/blog")({
  loader: () => getPageContent({ data: { pageKey: "blog", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "News, reviews and articles from the KLEFF board game community." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "News and articles from the KLEFF community." },
    ],
  }),
  component: BlogPage,
});
