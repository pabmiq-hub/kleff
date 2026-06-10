import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getInstagramFollowers, getInstagramPosts } from "@/lib/media.functions";
import { listMediaAppearances } from "@/lib/media-appearances.functions";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/medios")({
  loader: async () => {
    const [mediaItems, followers, igPosts, pageContent] = await Promise.all([
      listMediaAppearances(),
      getInstagramFollowers(),
      getInstagramPosts(),
      getPageContent({ data: { pageKey: "media" } }),
    ]);
    return { mediaItems, followers, igPosts, pageContent };
  },
  head: () => ({
    meta: [
      { title: "Media — KLEFF" },
      {
        name: "description",
        content:
          "Reportajes, podcasts y artículos sobre KLEFF en Cadena SER, RTVE, Time Out, El Periódico y más. Sigue el feed de Instagram @kleff.bcn.",
      },
      { property: "og:title", content: "Media — KLEFF" },
      {
        property: "og:description",
        content: "Han hablado de nosotros. Mira todas las apariciones en prensa y nuestro Instagram.",
      },
    ],
  }),
  component: MediaPage,
});
