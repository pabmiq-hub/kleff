import { createFileRoute } from "@tanstack/react-router";
import { listBlogPosts } from "@/lib/blog.functions";
import { BlogListPage } from "@/components/pages/BlogListPage";

export const Route = createFileRoute("/en/blog")({
  loader: () => listBlogPosts({ data: { locale: "en" } }),
  head: () => ({
    meta: [
      { title: "Blog — KLEFF" },
      { name: "description", content: "Reviews, recommendations and stories from KLEFF's board game nights in Barcelona." },
      { property: "og:title", content: "Blog — KLEFF" },
      { property: "og:description", content: "Reviews and articles from the KLEFF community." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  return <BlogListPage posts={posts} />;
}
