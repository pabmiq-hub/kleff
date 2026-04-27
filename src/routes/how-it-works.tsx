import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "@/components/pages/HowItWorksPage";

export const Route = createFileRoute("/how-it-works")({
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
    ],
  }),
  component: HowItWorksPage,
});
