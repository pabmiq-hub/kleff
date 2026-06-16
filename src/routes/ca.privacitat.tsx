import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/ca/privacitat")({
  loader: () => getPageContent({ data: { pageKey: "privacy", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Política de Privacitat — KLEFF" },
      { name: "description", content: "Política de privacitat de KLEFF conforme al RGPD i la LOPDGDD." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/ca/privacitat" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/ca/privacitat" }],
  }),
  component: () => <LegalPage kind="privacy" />,
});
