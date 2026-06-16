import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LudotecaPage } from "@/components/pages/LudotecaPage";

export const Route = createFileRoute("/ca/ludoteca")({
  loader: () => getPageContent({ data: { pageKey: "ludoteca", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Ludoteca KLEFF — La nostra col·lecció de jocs" },
      {
        name: "description",
        content:
          "Explora els més de cent jocs de la ludoteca de KLEFF: filtra per jugadors, durada, dificultat i mecàniques. Sincronitzat amb BoardGameGeek.",
      },
      { property: "og:title", content: "Ludoteca KLEFF" },
      { property: "og:description", content: "Més de cent jocs per jugar a KLEFF Barcelona." },
      { property: "og:url", content: "https://kleff.es/ca/ludoteca" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/ca/ludoteca" }],
  }),
  component: LudotecaPage,
});
