import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/ca/qui-som")({
  loader: () => getPageContent({ data: { pageKey: "about", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Qui som — KLEFF" },
      { name: "description", content: "La història de KLEFF: d'una crisi personal el 2018 a la comunitat de jocs de taula més gran de Barcelona." },
      { property: "og:title", content: "Qui som — KLEFF" },
      { property: "og:description", content: "Sis anys, un propòsit: convertir taules en punts de trobada." },
    ],
  }),
  component: AboutPage,
});
