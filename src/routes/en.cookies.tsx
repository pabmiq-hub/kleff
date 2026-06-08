import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { LegalPage } from "@/components/pages/LegalPage";

export const Route = createFileRoute("/en/cookies")({
  loader: () => getPageContent({ data: { pageKey: "cookies", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Cookie Policy — KLEFF" },
      { name: "description", content: "KLEFF cookie policy: types of cookies, purpose and how to configure them." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: () => <LegalPage kind="cookies" />,
});
