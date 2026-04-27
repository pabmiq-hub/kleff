import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getMediaItems } from "@/server/media.functions";

export const Route = createFileRoute("/media")({
  loader: async () => {
    const mediaItems = await getMediaItems();
    return { mediaItems };
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
