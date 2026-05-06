import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/server/content.functions";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/en/contact")({
  loader: () => getPageContent({ data: { pageKey: "contact", locale: "en" } }).then((pageContent) => ({ pageContent })),
  head: () => ({
    meta: [
      { title: "Contact — KLEFF" },
      { name: "description", content: "Get in touch with KLEFF for collaborations, private events or general inquiries." },
      { property: "og:title", content: "Contact — KLEFF" },
      { property: "og:description", content: "Let's talk. We're at l'Estació de França, Barcelona." },
    ],
  }),
  component: ContactPage,
});
