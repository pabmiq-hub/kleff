import { createFileRoute, redirect } from "@tanstack/react-router";

// Backward-compatible: /inscripcion/<slug> → /<slug>
export const Route = createFileRoute("/inscripcion/$slug")({
  loader: ({ params }) => {
    throw redirect({ to: "/$", params: { _splat: params.slug }, statusCode: 301, reloadDocument: true });
  },
  component: () => null,
});
