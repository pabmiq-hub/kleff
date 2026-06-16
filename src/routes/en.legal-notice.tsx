import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/en/legal-notice")({
  loader: () => getPageContent({ data: { pageKey: "legal-notice", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Legal Notice — KLEFF" },
      { name: "description", content: "Legal information about the owner of kleff.es under Spanish LSSI-CE law." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/en/legal-notice" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/legal-notice" }],
  }),
  component: () => <LegalPage kind="legal-notice" />,
});
