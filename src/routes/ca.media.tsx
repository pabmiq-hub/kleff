import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getMediaItems, getInstagramFollowers } from "@/server/media.functions";

export const Route = createFileRoute("/ca/media")({
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
