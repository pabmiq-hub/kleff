import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKonektumOverview } from "@/lib/konektum.functions";
import { CalendarDays, Users, Handshake, Target, Rocket, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/konektum/")({
  component: KonektumHome,
});

type Overview = Awaited<ReturnType<typeof getKonektumOverview>>;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function KonektumHome() {
  const fn = useServerFn(getKonektumOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [fn]);

  const upcoming = (data?.events ?? [])
    .filter((e) => e.status === "pending" || e.status === "active")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextEvent = upcoming[0] ?? null;
  const recent = (data?.events ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold">Konektum</h1>
        <p className="text-ink/60 mt-1">
          {data
            ? `${data.stats.activeEvents} eventos activos y ${data.stats.uniqueParticipants} participantes registrados.`
            : "Cargando datos de eventos…"}
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm text-ink">
          No se pudo conectar con Konektum: {error}
        </div>
      )}

      {nextEvent && (
        <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-coral flex items-center justify-center shrink-0">
            <Rocket className="h-6 w-6 text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg font-bold truncate">{nextEvent.name}</p>
            <p className="text-sm text-ink/60">
              {daysUntil(nextEvent.date) > 0 ? `En ${daysUntil(nextEvent.date)} días` : "Hoy"} ·{" "}
              {nextEvent.participants_count} participantes
            </p>
          </div>
          <Link
            to="/admin/konektum/eventos"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-ink/90"
          >
            Gestionar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<CalendarDays className="h-5 w-5" />} label="Eventos totales" value={data?.stats.totalEvents} />
        <Stat icon={<Users className="h-5 w-5" />} label="Participantes únicos" value={data?.stats.uniqueParticipants} />
        <Stat icon={<Handshake className="h-5 w-5" />} label="Matches mutuos" value={data?.stats.mutualMatches} />
        <Stat
          icon={<Target className="h-5 w-5" />}
          label="Tasa de selección"
          value={data ? `${data.stats.selectionRate}%` : undefined}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Eventos recientes</h2>
          <Link to="/admin/konektum/eventos" className="text-sm text-ink/60 hover:text-ink">
            Ver todos
          </Link>
        </div>
        <div className="space-y-2">
          {recent.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-coral/30 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.name}</p>
                <p className="text-xs text-ink/60">{formatDate(e.date)}</p>
              </div>
              <p className="text-right text-sm">
                <span className="font-display text-xl font-bold">{e.participants_count}</span>
                <br />
                <span className="text-xs text-ink/60">participantes</span>
              </p>
            </div>
          ))}
          {!error && recent.length === 0 && <p className="text-sm text-ink/60">Sin eventos todavía.</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number | string }) {
  return (
    <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5">
      <div className="flex items-center gap-2 text-ink/70 text-xs font-semibold uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className="font-display text-4xl font-bold mt-2">{value ?? "—"}</p>
    </div>
  );
}
