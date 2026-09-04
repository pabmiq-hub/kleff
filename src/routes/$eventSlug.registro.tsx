// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { resolveKonEvent } from "@/lib/kon-public.functions";
import { PublicEventPage } from "@/konektum/pages/PublicEventPage";
import ParticipantJoin from "@/konektum/pages/ParticipantJoin";

export const Route = createFileRoute("/$eventSlug/registro")({
  loader: ({ params }) => resolveKonEvent({ data: { slug: params.eventSlug } }),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Evento";
    const title = `Registro · ${name} · KLEFF`;
    const description = `Registro del evento ${name} organizado por KLEFF.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const event = Route.useLoaderData();
  return (
    <PublicEventPage event={event}>
      <ParticipantJoin />
    </PublicEventPage>
  );
}
