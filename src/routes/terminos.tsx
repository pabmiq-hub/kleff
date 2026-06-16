import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/terminos")({
  loader: () => getPageContent({ data: { pageKey: "terms" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Términos y Condiciones — KLEFF" },
      { name: "description", content: "Términos y condiciones de uso del sitio web y los servicios de KLEFF." },
      { name: "robots", content: "noindex,follow" },
      { property: "og:url", content: "https://kleff.es/terminos" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/terminos" }],
  }),
  component: () => <LegalPage kind="terms" />,
});
