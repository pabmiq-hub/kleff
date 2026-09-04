import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKonektumOverview } from "@/lib/konektum.functions";
import { CalendarDays, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/konektum/eventos/")({
  component: KonektumEvents,
});

type Overview = Awaited<ReturnType<typeof getKonektumOverview>>;
type Filter = "upcoming" | "past" | "test" | "all";

const STATUS_LABEL: Record<string, string> = {
  pending: "Próximo",
  active: "Activo",
  completed: "Finalizado",
  cancelled: "Cancelado",
  draft: "Borrador",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Próximos y activos" },
  { key: "past", label: "Pasados" },
  { key: "test", label: "De prueba" },
  { key: "all", label: "Todos" },
];

function KonektumEvents() {
  const fn = useServerFn(getKonektumOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [q, setQ] = useState("");

  useEffect(() => {
    void fn({ data: undefined as never })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [fn]);

  const events = useMemo(() => {
    const all = data?.events ?? [];
    const byFilter = all.filter((e) => {
      if (filter === "all") return true;
      if (filter === "test") return Boolean(e.is_test_event);
      if (e.is_test_event) return false;
      const upcoming = e.status === "pending" || e.status === "active";
      return filter === "upcoming" ? upcoming : !upcoming;
    });
    const needle = q.trim().toLowerCase();
    return needle ? byFilter.filter((e) => e.name.toLowerCase().includes(needle)) : byFilter;
  }, [data, filter, q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Eventos</h1>
        <p className="text-ink/60 mt-1">Todos los eventos de Konektum.</p>
      </header>

      {error && (
        <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
          No se pudieron cargar los eventos: {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? "bg-coral text-ink" : "text-ink/70 hover:bg-ink/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar evento…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <Link
            key={e.id}
            to="/admin/konektum/eventos/$id"
            params={{ id: e.id }}
            className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4 hover:border-coral transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-coral/30 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-ink" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{e.name}</p>
              <p className="text-xs text-ink/60">
                {new Date(e.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {STATUS_LABEL[e.status] ?? e.status}
                {e.is_test_event ? " · prueba" : ""}
              </p>
            </div>
            <p className="text-right text-sm">
              <span className="font-display text-xl font-bold">{e.participants_count}</span>
              <br />
              <span className="text-xs text-ink/60">participantes</span>
            </p>
            <ArrowRight className="h-4 w-4 text-ink/40 shrink-0" />
          </Link>
        ))}
        {!error && data && events.length === 0 && (
          <p className="text-sm text-ink/60">No hay eventos con este filtro.</p>
        )}
        {!error && !data && <p className="text-sm text-ink/60">Cargando…</p>}
      </div>
    </div>
  );
}
