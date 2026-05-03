import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getMediaItems, getInstagramFollowers } from "@/server/media.functions";

export const Route = createFileRoute("/media")({
  loader: async () => {
    const [mediaItems, followers] = await Promise.all([
      getMediaItems(),
      getInstagramFollowers(),
    ]);
    return { mediaItems, followers };
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
