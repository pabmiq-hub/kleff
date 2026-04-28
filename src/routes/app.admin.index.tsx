import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/")({
  component: () => (
    <div>
      <p className="text-muted-foreground">Selecciona una sección arriba: invitaciones o usuarios.</p>
    </div>
  ),
});
