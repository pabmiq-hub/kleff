import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/aviso-legal")({
  loader: () => getPageContent({ data: { pageKey: "legal-notice" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Aviso Legal — KLEFF" },
      { name: "description", content: "Información legal del titular del sitio web kleff.es conforme a la LSSI-CE." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/aviso-legal" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/aviso-legal" }],
  }),
  component: () => <LegalPage kind="legal-notice" />,
});
