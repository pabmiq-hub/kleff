import { createFileRoute } from "@tanstack/react-router";
import { TournamentsPage } from "@/components/pages/TournamentsPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/ca/tornejos")({
  loader: () => getPageContent({ data: { pageKey: "tournaments", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Tornejos a KLEFF — Comunitat amb tornejos gairebé cada setmana a Barcelona" },
      {
        name: "description",
        content:
          "Comunitat de Tornejos a KLEFF Barcelona: diversos tornejos al mes amb formats 1vs1, suís i classificatoris. Inscripcions gratuïtes o destinades a premis.",
      },
      { property: "og:title", content: "Tornejos a KLEFF" },
      {
        property: "og:description",
        content:
          "Diversos tornejos al mes a KLEFF: gratuïts o amb quota destinada a premis. Uneix-te al grup de WhatsApp.",
      },
    ],
  }),
  component: TournamentsPage,
});
