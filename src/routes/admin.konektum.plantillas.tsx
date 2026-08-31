import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/konektum/plantillas")({
  component: Page,
});

function Page() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Plantillas</h1>
      <p className="text-ink/60">
        Esta sección de Konektum se integrará en la siguiente entrega. Los datos siguen disponibles
        y funcionando en el panel actual de Konektum.
      </p>
    </div>
  );
}
