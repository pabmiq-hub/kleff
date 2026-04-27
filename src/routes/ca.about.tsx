import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";
import { getOgPreviews } from "@/server/og.functions";
import { PRESS_LINKS } from "@/data/press";

export const Route = createFileRoute("/ca/about")({
  loader: () => getOgPreviews({ data: { urls: PRESS_LINKS.map((p) => p.url) } }),
  staleTime: 24 * 60 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Qui som — KLEFF" },
      { name: "description", content: "Coneix KLEFF: la nostra història, valors, equip, comunitats i col·laboradors." },
      { property: "og:title", content: "Qui som — KLEFF" },
      { property: "og:description", content: "La nostra història, valors i l'equip de KLEFF." },
    ],
  }),
  component: AboutPage,
});
