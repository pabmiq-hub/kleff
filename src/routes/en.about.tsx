import { createFileRoute } from "@tanstack/react-router";
import { getPageContent } from "@/lib/content.functions";
import { listTeamMembersPublic, type TeamMemberRow } from "@/lib/team.functions";
import { AboutPage } from "@/components/pages/AboutPage";

export const Route = createFileRoute("/en/about")({
  loader: async () => {
    const [pageContent, team] = await Promise.all([
      getPageContent({ data: { pageKey: "about", locale: "en" } }),
      listTeamMembersPublic().catch(() => [] as TeamMemberRow[]),
    ]);
    return { pageContent, team };
  },
  head: () => ({
    meta: [
      { title: "About — KLEFF" },
      { name: "description", content: "The KLEFF story: from a personal crisis in 2018 to Barcelona's biggest board game community." },
      { property: "og:title", content: "About — KLEFF" },
      { property: "og:description", content: "Six years, one purpose: turning tables into meeting points." },
      { property: "og:url", content: "https://kleff.es/en/about" },
    ],
    links: [{ rel: "canonical", href: "https://kleff.es/en/about" }],
  }),
  component: AboutPage,
});
