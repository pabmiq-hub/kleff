import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/en/privacy")({
  loader: () => getPageContent({ data: { pageKey: "privacy", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Privacy Policy — KLEFF" },
      { name: "description", content: "Privacy policy for KLEFF under GDPR and Spanish data protection law." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/en/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/privacy" }],
  }),
  component: () => <LegalPage kind="privacy" />,
});
