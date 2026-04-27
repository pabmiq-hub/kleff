import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";
import { getOgPreviews } from "@/server/og.functions";
import { PRESS_LINKS } from "@/data/press";

export const Route = createFileRoute("/en/about")({
  loader: () => getOgPreviews({ data: { urls: PRESS_LINKS.map((p) => p.url) } }),
  staleTime: 24 * 60 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "About — KLEFF" },
      { name: "description", content: "Get to know KLEFF: our story, values, team, communities and partners." },
      { property: "og:title", content: "About — KLEFF" },
      { property: "og:description", content: "Our story, values and the team behind KLEFF." },
    ],
  }),
  component: AboutPage,
});
