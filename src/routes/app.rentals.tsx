import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/rentals")({
  component: () => (
    <div>
      <h1 className="font-display text-3xl font-bold mb-2">Alquiler de juegos</h1>
      <p className="text-muted-foreground">Próximamente, sincronizado con BoardGameGeek.</p>
    </div>
  ),
});
