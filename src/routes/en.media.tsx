import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getInstagramPosts } from "@/lib/media.functions";
import { listMediaAppearances } from "@/lib/media-appearances.functions";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/en/media")({
  loader: async () => {
    const [mediaItems, igPosts, pageContent] = await Promise.all([
      listMediaAppearances(),
      getInstagramPosts(),
      getPageContent({ data: { pageKey: "media", locale: "en" } }),
    ]);
    return { mediaItems, igPosts, pageContent };
  },
  head: () => ({
    meta: [
      { title: "Media — KLEFF" },
      {
        name: "description",
        content:
          "Reports, podcasts and articles about KLEFF on Cadena SER, RTVE, Time Out, El Periódico and more. Follow our Instagram feed @kleff.bcn.",
      },
      { property: "og:title", content: "Media — KLEFF" },
      {
        property: "og:description",
        content: "They've talked about us. See every press appearance and our Instagram.",
      },
      { property: "og:url", content: "https://kleff.es/en/media" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/media" }],
  }),
  component: MediaPage,
});
