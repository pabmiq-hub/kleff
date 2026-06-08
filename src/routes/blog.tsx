import { createFileRoute } from "@tanstack/react-router";
import { listBlogPosts } from "@/lib/blog.functions";
import { BlogListPage } from "@/components/pages/BlogListPage";

export const Route = createFileRoute("/blog")({
  loader: () => listBlogPosts({ data: { locale: "es" } }),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "Reseñas, recomendaciones y crónicas de las noches de juegos de KLEFF en Barcelona." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "Reseñas y artículos de la comunidad KLEFF." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  return <BlogListPage posts={posts} />;
}
