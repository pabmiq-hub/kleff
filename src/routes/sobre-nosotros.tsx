import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/sobre-nosotros")({
  loader: () => getPageContent({ data: { pageKey: "about" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Quiénes somos — KLEFF" },
      {
        name: "description",
        content:
          "La historia de KLEFF: de una crisis personal en 2018 a la comunidad de juegos de mesa más grande de Barcelona.",
      },
      { property: "og:title", content: "Quiénes somos — KLEFF" },
      {
        property: "og:description",
        content: "Seis años, un propósito: convertir mesas en puntos de encuentro.",
      },
      { property: "og:url", content: "https://kleff.es/sobre-nosotros" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/sobre-nosotros" }],
  }),
  component: AboutPage,
});
