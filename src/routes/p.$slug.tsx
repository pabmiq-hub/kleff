import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublishedPage } from "@/server/cms.functions";
import { BlocksList, type BlockData } from "@/components/cms/BlockRenderer";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const result = await getPublishedPage({ data: { slug: params.slug } });
    if (!result.page) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) return { meta: [{ title: "Página no encontrada — KLEFF" }] };
    return {
      meta: [
        { title: `${page.title} — KLEFF` },
        ...(page.description ? [{ name: "description", content: page.description }] : []),
        { property: "og:title", content: page.title },
        ...(page.description ? [{ property: "og:description", content: page.description }] : []),
        ...(page.og_image_url ? [{ property: "og:image", content: page.og_image_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-ink mb-4">404</h1>
        <p className="text-ink/70">Esta página no existe o no está publicada.</p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <p className="text-ink/70">Error: {error.message}</p>
    </div>
  ),
  component: PublicPage,
});

function PublicPage() {
  const { blocks } = Route.useLoaderData();
  return (
    <main className="min-h-screen bg-background">
      <BlocksList blocks={blocks as BlockData[]} />
    </main>
  );
}
