import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { BlogPage } from "@/components/pages/BlogPage";

export const Route = createFileRoute("/ca/blog")({
  loader: () => getPageContent({ data: { pageKey: "blog", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "Notícies, ressenyes i articles de la comunitat KLEFF." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "Notícies i articles de la comunitat KLEFF." },
    ],
  }),
  component: BlogPage,
});
