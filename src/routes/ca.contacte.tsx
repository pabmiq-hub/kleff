import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pages/ContactPage";

export const Route = createFileRoute("/ca/contact")({
  head: () => ({
    meta: [
      { title: "Contacte — KLEFF" },
      { name: "description", content: "Posa't en contacte amb KLEFF per col·laboracions, esdeveniments privats o consultes." },
      { property: "og:title", content: "Contacte — KLEFF" },
      { property: "og:description", content: "Parlem. Som a l'Estació de França, Barcelona." },
    ],
  }),
  component: ContactPage,
});
