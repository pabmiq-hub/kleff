import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/ca/avis-legal")({
  loader: () => getPageContent({ data: { pageKey: "legal-notice", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Avís Legal — KLEFF" },
      { name: "description", content: "Informació legal del titular del lloc web kleff.es conforme a la LSSI-CE." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/ca/avis-legal" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/ca/avis-legal" }],
  }),
  component: () => <LegalPage kind="legal-notice" />,
});
