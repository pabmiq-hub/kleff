import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/carnet")({
  component: () => (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Carnet de Kleffer</h1>
      <p className="text-muted-foreground">Esta sección está en construcción.</p>
    </div>
  ),
});
