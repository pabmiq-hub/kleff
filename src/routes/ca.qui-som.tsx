import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { listTeamMembersPublic, type TeamMemberRow } from "@/lib/team.functions";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/ca/qui-som")({
  loader: async () => {
    const [pageContent, team] = await Promise.all([
      getPageContent({ data: { pageKey: "about", locale: "ca" } }),
      listTeamMembersPublic().catch(() => [] as TeamMemberRow[]),
    ]);
    return { pageContent, team };
  },
  head: () => ({
    meta: [
      { title: "Qui som — KLEFF" },
      { name: "description", content: "La història de KLEFF: d'una crisi personal el 2018 a la comunitat de jocs de taula més gran de Barcelona." },
      { property: "og:title", content: "Qui som — KLEFF" },
      { property: "og:description", content: "Sis anys, un propòsit: convertir taules en punts de trobada." },
      { property: "og:url", content: "https://kleff.es/ca/qui-som" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/ca/qui-som" }],
  }),
  component: AboutPage,
});
