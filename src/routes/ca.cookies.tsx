import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/ca/cookies")({
  loader: () => getPageContent({ data: { pageKey: "cookies", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Política de Galetes — KLEFF" },
      { name: "description", content: "Política de galetes de KLEFF: tipus, finalitat i com configurar-les." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="cookies" />,
});
