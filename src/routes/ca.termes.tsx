import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/ca/termes")({
  loader: () => getPageContent({ data: { pageKey: "terms", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Termes i Condicions — KLEFF" },
      { name: "description", content: "Termes i condicions d'ús del lloc web i els serveis de KLEFF." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="terms" />,
});
