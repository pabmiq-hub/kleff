// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import SeriesJoin from "@/konektum/pages/SeriesJoin";

export const Route = createFileRoute("/s/$seriesSlug/join")({
  head: () => ({
    meta: [
      { title: "Serie de eventos · KLEFF" },
      { name: "description", content: "Apúntate a la próxima fecha de esta serie de eventos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Serie de eventos · KLEFF" },
      { property: "og:description", content: "Apúntate a la próxima fecha de esta serie de eventos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SeriesJoin,
});
