// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { resolveKonEvent } from "@/lib/kon-public.functions";
import { PublicEventPage } from "@/konektum/pages/PublicEventPage";
import ParticipantCancellation from "@/konektum/pages/ParticipantCancellation";

export const Route = createFileRoute("/event/$id/cancel/$participantId")({
  head: () => ({
    meta: [
      { title: "Cancelar inscripción · KLEFF" },
      { name: "description", content: "Cancela tu inscripción al evento." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Cancelar inscripción · KLEFF" },
      { property: "og:description", content: "Cancela tu inscripción al evento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ params }) => resolveKonEvent({ data: { slug: params.id } }),
  component: RouteComponent,
});

function RouteComponent() {
  const event = Route.useLoaderData();
  return (
    <PublicEventPage event={event}>
      <ParticipantCancellation />
    </PublicEventPage>
  );
}
