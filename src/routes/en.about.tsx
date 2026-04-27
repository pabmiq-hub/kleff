import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/en/about")({
  head: () => ({
    meta: [
      { title: "About — KLEFF" },
      { name: "description", content: "The KLEFF story: from a personal crisis in 2018 to Barcelona's biggest board game community." },
      { property: "og:title", content: "About — KLEFF" },
      { property: "og:description", content: "Six years, one purpose: turning tables into meeting points." },
    ],
  }),
  component: AboutPage,
});
