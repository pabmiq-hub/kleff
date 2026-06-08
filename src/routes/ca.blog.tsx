import { createFileRoute } from "@tanstack/react-router";
import { listBlogPosts } from "@/lib/blog.functions";
import { BlogListPage } from "@/components/pages/BlogListPage";

export const Route = createFileRoute("/ca/blog")({
  loader: () => listBlogPosts({ data: { locale: "ca" } }),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "Ressenyes, recomanacions i cròniques de les nits de jocs de KLEFF a Barcelona." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "Ressenyes i articles de la comunitat KLEFF." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  return <BlogListPage posts={posts} />;
}
