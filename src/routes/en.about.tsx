import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/en/about")({
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
