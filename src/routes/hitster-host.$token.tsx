import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Music } from "lucide-react";
import { hitsterCollabResolve } from "@/lib/hitster.functions";
import { HitsterHostPanel } from "@/components/hitster/HitsterHostPanel";

export const Route = createFileRoute("/hitster-host/$token")({
  loader: async ({ params }) => {
    const collab = await hitsterCollabResolve({ data: { token: params.token } });
    return { collab, token: params.token };
  },
  head: () => ({
    meta: [
      { title: "Gestión de partida Hitster — KLEFF" },
      { name: "description", content: "Panel de colaborador para gestionar una partida de Hitster en KLEFF." },
      { property: "og:title", content: "Gestión de partida Hitster — KLEFF" },
      { property: "og:description", content: "Panel de colaborador para gestionar una partida de Hitster en KLEFF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HitsterCollabHostPage,
});

function HitsterCollabHostPage() {
  const { collab, token } = Route.useLoaderData();
  const [qc] = useState(() => new QueryClient());

  if (!collab) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-2">
          <Music className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="font-display text-xl font-bold">Enlace no válido</h1>
          <p className="text-sm text-muted-foreground">
            Esta invitación de colaborador ha caducado o ha sido revocada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-sm">
          <span className="font-display font-bold flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" /> KLEFF · Hitster (Colaborador)
          </span>
          <span className="text-xs text-muted-foreground truncate">{collab.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <QueryClientProvider client={qc}>
          <HitsterHostPanel gameId={collab.game_id} collabToken={token} />
        </QueryClientProvider>
      </main>
    </div>
  );
}