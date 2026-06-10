import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getInstagramFollowers, getInstagramPosts } from "@/lib/media.functions";
import { listMediaAppearances } from "@/lib/media-appearances.functions";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/ca/mitjans")({
  loader: async () => {
    const [mediaItems, followers, igPosts, pageContent] = await Promise.all([
      listMediaAppearances(),
      getInstagramFollowers(),
      getInstagramPosts(),
      getPageContent({ data: { pageKey: "media", locale: "ca" } }),
    ]);
    return { mediaItems, followers, igPosts, pageContent };
  },
  head: () => ({
    meta: [
      { title: "Media — KLEFF" },
      {
        name: "description",
        content:
          "Reportatges, podcasts i articles sobre KLEFF a Cadena SER, RTVE, Time Out, El Periódico i més. Segueix el feed d'Instagram @kleff.bcn.",
      },
      { property: "og:title", content: "Media — KLEFF" },
      {
        property: "og:description",
        content: "N'han parlat. Mira totes les aparicions a premsa i el nostre Instagram.",
      },
    ],
  }),
  component: MediaPage,
});
