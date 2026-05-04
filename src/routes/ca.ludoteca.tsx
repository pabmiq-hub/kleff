import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { LudotecaPage } from "@/components/pages/LudotecaPage";

export const Route = createFileRoute("/ca/ludoteca")({
  loader: () => getPageContent({ data: { pageKey: "ludoteca" } }).then((pageContent) => ({ pageContent })),
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
    ],
  }),
  component: LudotecaPage,
});
