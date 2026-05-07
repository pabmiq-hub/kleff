import { createFileRoute } from "@tanstack/react-router";
import { CatanPage } from "@/components/pages/CatanPage";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/ca/catan")({
  loader: () => getPageContent({ data: { pageKey: "catan", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Catan a KLEFF — Comunitat activa, tornejos mensuals a Barcelona" },
      {
        name: "description",
        content:
          "Comunitat de Catan a KLEFF Barcelona: més de 250 membres, tornejos cada mes i partides setmanals. Uneix-te al grup de WhatsApp.",
      },
      { property: "og:title", content: "Catan a KLEFF" },
      {
        property: "og:description",
        content:
          "Més de 250 jugadors, tornejos cada mes i partides setmanals. Uneix-te a la comunitat de Catan a KLEFF.",
      },
    ],
  }),
  component: CatanPage,
});
