// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { resolveKonEvent } from "@/lib/kon-public.functions";
import { PublicEventPage } from "@/konektum/pages/PublicEventPage";
import ParticipantCheckin from "@/konektum/pages/ParticipantCheckin";

export const Route = createFileRoute("/$eventSlug/check-in")({
  loader: ({ params }) => resolveKonEvent({ data: { slug: params.eventSlug } }),
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Evento";
    const title = `Check-in · ${name} · KLEFF`;
    const description = `Check-in del evento ${name} organizado por KLEFF.`;
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
      <ParticipantCheckin />
    </PublicEventPage>
  );
}
