import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/en/terms")({
  loader: () => getPageContent({ data: { pageKey: "terms", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Terms & Conditions — KLEFF" },
      { name: "description", content: "Terms and conditions of use for the KLEFF website and services." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="terms" />,
});
