import { createFileRoute } from "@tanstack/react-router";
import { HiddenRolesPage } from "@/components/pages/HiddenRolesPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/roles-ocultos")({
  loader: () => getPageContent({ data: { pageKey: "hiddenRoles" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Roles Ocultos en KLEFF — Comunidad de deducción social, mentiras e identidades secretas" },
      {
        name: "description",
        content:
          "Comunidad de Roles Ocultos en KLEFF Barcelona: más de 200 miembros, partidas semanales, murder mysteries y el Hidden Roles Fest cada trimestre.",
      },
      { property: "og:title", content: "Roles Ocultos en KLEFF" },
      {
        property: "og:description",
        content: "Más de 200 miembros, partidas semanales, murder mysteries y Hidden Roles Fest. Únete al WhatsApp.",
      },
      { property: "og:url", content: "https://kleff.es/roles-ocultos" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/roles-ocultos" }],
  }),
  component: HiddenRolesPage,
});
