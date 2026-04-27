import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/components/pages/MediaPage";
import { getMediaItems } from "@/server/media.functions";

export const Route = createFileRoute("/en/media")({
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
