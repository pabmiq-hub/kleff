import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/cookies")({
  loader: () => getPageContent({ data: { pageKey: "cookies" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Política de Cookies — KLEFF" },
      { name: "description", content: "Política de cookies de KLEFF: tipos de cookies, finalidad y cómo configurarlas." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="cookies" />,
});
