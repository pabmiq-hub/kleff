import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getInstagramFollowers, getInstagramPosts } from "@/lib/media.functions";
import { listMediaAppearances } from "@/lib/media-appearances.functions";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/en/media")({
  loader: async () => {
    const [mediaItems, followers, igPosts, pageContent] = await Promise.all([
      listMediaAppearances(),
      getInstagramFollowers(),
      getInstagramPosts(),
      getPageContent({ data: { pageKey: "media", locale: "en" } }),
    ]);
    return { mediaItems, followers, igPosts, pageContent };
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
    ],
  }),
  component: MediaPage,
});
