import { createFileRoute } from "@tanstack/react-router";
import { HiddenRolesPage } from "@/components/pages/HiddenRolesPage";
import { getPageContent } from "@/lib/content.functions";

export const Route = createFileRoute("/en/hidden-roles")({
  loader: () => getPageContent({ data: { pageKey: "hiddenRoles", locale: "en" } }).then((pageContent) => ({ pageContent })),
  staleTime: 5 * 60 * 1000,
  head: () => ({
    meta: [
      { title: "Hidden Roles at KLEFF — Social deduction, lies and secret identities" },
      {
        name: "description",
        content:
          "Hidden Roles community at KLEFF Barcelona: 200+ members, weekly games, murder mysteries and the quarterly Hidden Roles Fest.",
      },
      { property: "og:title", content: "Hidden Roles at KLEFF" },
      {
        property: "og:description",
        content: "200+ members, weekly games, murder mysteries and Hidden Roles Fest. Join the WhatsApp group.",
      },
      { property: "og:url", content: "https://kleff.es/en/hidden-roles" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/hidden-roles" }],
  }),
  component: HiddenRolesPage,
});
