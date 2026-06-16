import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { HowItWorksPage } from "@/components/pages/HowItWorksPage";

export const Route = createFileRoute("/como-funciona")({
  loader: () => getPageContent({ data: { pageKey: "how" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Cómo funciona — KLEFF" },
      {
        name: "description",
        content:
          "Así funciona KLEFF: actividades gratuitas, 4€ de consumición, comunidades de Blood on the Clocktower, Catan, Unmatched y más. Hazte socio y disfruta de ventajas exclusivas.",
      },
      { property: "og:title", content: "Cómo funciona — KLEFF" },
      {
        property: "og:description",
        content:
          "Vienes solo o acompañado, el #TeamKLEFF te ayuda a encontrar mesa. Más de 300 juegos te esperan cada semana.",
      },
      { property: "og:url", content: "https://kleff.es/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/como-funciona" }],
  }),
  component: HowItWorksPage,
});
