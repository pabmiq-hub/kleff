import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getKonektumAnalytics } from "@/lib/konektum.functions";

export const Route = createFileRoute("/admin/konektum/analitica")({
  component: Page,
});

type Analytics = Awaited<ReturnType<typeof getKonektumAnalytics>>;

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function monthLabel(m: string) {
  const [y, mm] = m.split("-");
  return `${MONTHS[Number(mm) - 1] ?? mm} ${y?.slice(2)}`;
}

function Page() {
  const fn = useServerFn(getKonektumAnalytics);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [fn]);

  if (error)
    return (
      <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
        No se pudo cargar la analítica: {error}
      </div>
    );
  if (!data) return <p className="text-sm text-ink/60">Cargando analítica…</p>;

  const t = data.totals;
  const maxMonth = Math.max(1, ...data.monthly.map((m) => m.participants));
  const genderTotal = Math.max(1, data.genders.reduce((s, g) => s + g.count, 0));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Analítica</h1>
        <p className="text-ink/60 mt-1">Datos agregados de todos los eventos reales.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Eventos" value={t.events} />
        <Stat label="Participaciones" value={t.participants} />
        <Stat label="Check-ins" value={t.checkedIn} />
        <Stat label="Cancelaciones" value={t.cancelled} />
        <Stat label="Han elegido" value={t.submitted} />
        <Stat label="Selecciones" value={t.selections} />
        <Stat label="Super likes" value={t.superLikes} />
        <Stat label="Matches mutuos" value={t.matches} />
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Participación por mes</h2>
        <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5 space-y-2">
          {data.monthly.map((m) => (
            <div key={m.month} className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 text-ink/60">{monthLabel(m.month)}</span>
              <div className="flex-1 h-3 rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${(m.participants / maxMonth) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-ink/60">
                {m.participants} · {m.events} ev.
              </span>
            </div>
          ))}
          {data.monthly.length === 0 && <p className="text-sm text-ink/60">Sin datos.</p>}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Género</h2>
          <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5 space-y-2">
            {data.genders.map((g) => (
              <div key={g.label} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate text-ink/60">{g.label}</span>
                <div className="flex-1 h-3 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ink/60"
                    style={{ width: `${(g.count / genderTotal) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right text-ink/60">{g.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Fidelidad</h2>
          <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5 space-y-1 text-sm">
            {data.retention.map((r) => (
              <div key={r.attended} className="flex justify-between">
                <span className="text-ink/60">
                  {r.attended} {r.attended === 1 ? "evento" : "eventos"}
                </span>
                <span className="font-medium">{r.people} personas</span>
              </div>
            ))}
            {data.retention.length === 0 && <p className="text-ink/60">Sin datos.</p>}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Eventos con más participación</h2>
        <div className="space-y-2">
          {data.topEvents.map((e) => (
            <Link
              key={e.id}
              to="/admin/konektum/eventos/$id"
              params={{ id: e.id }}
              className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4 hover:border-coral transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.name}</p>
                <p className="text-xs text-ink/60">
                  {new Date(e.date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm text-ink/60">
                <span className="font-display text-lg font-bold text-ink">{e.participants}</span> pers.
              </p>
              <p className="text-sm text-ink/60">
                <span className="font-display text-lg font-bold text-ink">{e.matches}</span> matches
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink/15 bg-ink/5 p-5">
      <p className="font-display text-3xl font-bold leading-none">{value}</p>
      <p className="text-xs text-ink/60 mt-2">{label}</p>
    </div>
  );
}
