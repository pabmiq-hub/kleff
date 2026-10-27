import { createFileRoute, redirect } from "@tanstack/react-router";
import { mmResolveSessionSlug } from "@/lib/mm/session-links.functions";
import { MMShell } from "@/components/mm/shared";

export const Route = createFileRoute("/j/$slug")({
  head: () => ({ meta: [
    { title: "Enlace de partida — KLEFF Juegos" },
    { name: "description", content: "Accede con el enlace corto a una partida de misterio de KLEFF." },
    { property: "og:title", content: "Enlace de partida — KLEFF Juegos" },
    { property: "og:description", content: "Únete a una partida de misterio con tu nombre y correo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: async ({ params }) => {
    const { sessionId } = await mmResolveSessionSlug({ data: { slug: params.slug } });
    if (sessionId) throw redirect({ to: "/actividades/juegos/unirse/$sessionId", params: { sessionId }, replace: true });
  },
  component: () => <MMShell><div className="grid min-h-screen place-items-center p-6 text-center"><p>Esta partida no existe o el enlace no es válido.</p></div></MMShell>,
});