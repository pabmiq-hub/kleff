import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ParamsOverrideProvider } from "@/konektum/router";
import type { KonPublicEvent } from "@/lib/kon-public.functions";

export function EventNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Evento no encontrado</h1>
      <p className="text-muted-foreground max-w-md">
        El enlace no es válido o el evento ya no está disponible. Comprueba la dirección con la organización.
      </p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Volver al inicio
      </Link>
    </main>
  );
}

/** Renders a ported participant page with the resolved event id as `id` param. */
export function PublicEventPage({
  event,
  children,
}: {
  event: KonPublicEvent | null;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ id: event?.id }), [event?.id]);
  if (!event) return <EventNotFound />;
  return <ParamsOverrideProvider value={value}>{children}</ParamsOverrideProvider>;
}

export default PublicEventPage;
