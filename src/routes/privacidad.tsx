import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/privacidad")({
  loader: () => getPageContent({ data: { pageKey: "privacy" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Política de Privacidad — KLEFF" },
      { name: "description", content: "Política de privacidad de KLEFF conforme al RGPD y la LOPDGDD." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="privacy" />,
});
