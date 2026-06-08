import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { HowItWorksPage } from "@/components/pages/HowItWorksPage";

export const Route = createFileRoute("/ca/com-funciona")({
  loader: () => getPageContent({ data: { pageKey: "how", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Com funciona — KLEFF" },
      {
        name: "description",
        content:
          "Així funciona KLEFF: activitats gratuïtes, 4€ de consumició, comunitats de Blood on the Clocktower, Catan, Unmatched i més. Fes-te soci i gaudeix d'avantatges exclusius.",
      },
      { property: "og:title", content: "Com funciona — KLEFF" },
      {
        property: "og:description",
        content:
          "Vens sol o acompanyat, el #TeamKLEFF t'ajuda a trobar taula. Més de 300 jocs t'esperen cada setmana.",
      },
    ],
  }),
  component: HowItWorksPage,
});
