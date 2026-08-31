import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKonektumOverview } from "@/lib/konektum.functions";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/admin/konektum/eventos")({
  component: KonektumEvents,
});

type Overview = Awaited<ReturnType<typeof getKonektumOverview>>;

const STATUS_LABEL: Record<string, string> = {
  pending: "Próximo",
  active: "Activo",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

function KonektumEvents() {
  const fn = useServerFn(getKonektumOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [fn]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Eventos</h1>
        <p className="text-ink/60 mt-1">Todos los eventos de Konektum.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
          No se pudo conectar con Konektum: {error}
        </div>
      )}

      <div className="space-y-2">
        {(data?.events ?? []).map((e) => (
          <div key={e.id} className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-coral/30 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-ink" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{e.name}</p>
              <p className="text-xs text-ink/60">
                {new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                {STATUS_LABEL[e.status] ?? e.status}
                {e.is_test_event ? " · prueba" : ""}
              </p>
            </div>
            <p className="text-right text-sm">
              <span className="font-display text-xl font-bold">{e.participants_count}</span>
              <br />
              <span className="text-xs text-ink/60">participantes</span>
            </p>
          </div>
        ))}
        {!error && data && data.events.length === 0 && <p className="text-sm text-ink/60">Sin eventos.</p>}
        {!error && !data && <p className="text-sm text-ink/60">Cargando…</p>}
      </div>
    </div>
  );
}
