import { createFileRoute } from "@tanstack/react-router";
import { SlowFriendingPage } from "@/components/pages/SlowFriendingPage";

export const Route = createFileRoute("/ca/slow-friending-ludic")({
  head: () => ({
    meta: [
      { title: "Slow Friending Lúdic — Coneix gent jugant a Barcelona | KLEFF" },
      {
        name: "description",
        content:
          "Slow Friending Lúdic: rotació de taules, jocs socials i KONEKTUM, la nostra app per a amistats, romanç i connexions reals. Esdeveniments a Barcelona.",
      },
      { property: "og:title", content: "Slow Friending Lúdic — KLEFF Barcelona" },
      {
        property: "og:description",
        content:
          "Més que jocs, són connexions. Rondes de 35 minuts, taules mixtes i app pròpia perquè res no es perdi quan acabi la nit.",
      },
      { property: "og:url", content: "https://kleff.es/ca/slow-friending-ludic" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/ca/slow-friending-ludic" }],
  }),
  component: SlowFriendingPage,
});
