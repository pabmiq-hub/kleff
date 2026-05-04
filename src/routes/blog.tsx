import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { BlogPage } from "@/components/pages/BlogPage";

export const Route = createFileRoute("/blog")({
  loader: () => getPageContent({ data: { pageKey: "blog" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "Noticias, reseñas y artículos sobre juegos de mesa de la comunidad KLEFF." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "Noticias y artículos de la comunidad KLEFF." },
    ],
  }),
  component: BlogPage,
});
