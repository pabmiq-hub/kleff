import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/ca/about")({
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
