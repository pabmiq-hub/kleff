import { createFileRoute } from "@tanstack/react-router";
import { HiddenRolesPage } from "@/components/pages/HiddenRolesPage";
import { getPageContent } from "@/server/content.functions";

export const Route = createFileRoute("/ca/rols-ocults")({
  loader: () => getPageContent({ data: { pageKey: "hiddenRoles", locale: "ca" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Rols Ocults a KLEFF — Comunitat de deducció social, mentides i identitats secretes" },
      {
        name: "description",
        content:
          "Comunitat de Rols Ocults a KLEFF Barcelona: més de 200 membres, partides setmanals, murder mysteries i el Hidden Roles Fest cada trimestre.",
      },
      { property: "og:title", content: "Rols Ocults a KLEFF" },
      {
        property: "og:description",
        content: "Més de 200 membres, partides setmanals, murder mysteries i Hidden Roles Fest. Uneix-te al WhatsApp.",
      },
    ],
  }),
  component: HiddenRolesPage,
});
