import { createFileRoute } from "@tanstack/react-router";
import { ClocktowerPage } from "@/components/pages/ClocktowerPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/ca/blood-on-the-clocktower")({
  loader: () => getPageContent({ data: { pageKey: "clocktower", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Blood on the Clocktower a KLEFF — Comunitat i partides setmanals a Barcelona" },
      {
        name: "description",
        content:
          "Una comunitat activa de Blood on the Clocktower a Barcelona: 3 partides simultànies cada setmana a KLEFF, tots els nivells, en castellà i anglès. Uneix-te al grup de WhatsApp.",
      },
      { property: "og:title", content: "Blood on the Clocktower a KLEFF" },
      {
        property: "og:description",
        content:
          "Partides setmanals del joc de deducció social més addictiu, a KLEFF Barcelona. Tots els nivells, comunitat activa.",
      },
    ],
  }),
  component: ClocktowerPage,
});
