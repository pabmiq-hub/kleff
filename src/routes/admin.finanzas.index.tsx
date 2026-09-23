import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { finDashboard, type FinanzasDashboard } from "@/lib/finanzas.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eur, fechaCorta, currentYear, yearOptions } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/")({
  component: FinanzasDashboardPage,
});

function FinanzasDashboardPage() {
  const load = useServerFn(finDashboard);
  const [anio, setAnio] = useState(currentYear());
  const [data, setData] = useState<FinanzasDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void load({ data: { anio } })
      .then((d) => alive && setData(d as FinanzasDashboard))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load, anio]);

  if (loading && !data) return <p className="text-ink/60">Cargando datos financieros…</p>;
  if (!data) return <p className="text-ink/60">No hay datos todavía.</p>;

  const maxBar = Math.max(1, ...data.trimestres.flatMap((t) => [t.ingresos, t.gastos]));
  const totalCuotas = Math.max(1, data.cuotas.total);
  const pct = (n: number) => Math.round((n / totalCuotas) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <label className="text-sm text-ink/60">Año</label>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-sm"
        >
          {yearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Card className="border-coral/40">
        <CardContent className="p-6">
          <p className="text-sm text-ink/60">Saldo actual estimado</p>
          <p className="font-display text-5xl font-bold mt-1">{eur(data.saldoEstimado)}</p>
          <p className="text-xs text-ink/60 mt-3">
            Ingresos acumulados {eur(data.ingresosTotales)} − gastos {eur(data.gastosTotales)} − provisión de
            impuestos pendiente {eur(data.provisionImpuestos)}.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos y gastos por trimestre ({anio})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.trimestres.map((t) => (
              <div key={t.trimestre} className="space-y-1">
                <div className="flex justify-between text-xs text-ink/70">
                  <span className="font-semibold">{t.trimestre}</span>
                  <span>
                    {eur(t.ingresos)} · <span className="text-ink/50">{eur(t.gastos)}</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-coral" style={{ width: `${(t.ingresos / maxBar) * 100}%` }} />
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-ink/50" style={{ width: `${(t.gastos / maxBar) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-ink/50">Barra superior: ingresos. Barra inferior: gastos.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuotas de socios {anio}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-4 rounded-full overflow-hidden bg-ink/10">
              <div className="bg-emerald-500" style={{ width: `${pct(data.cuotas.pagado)}%` }} />
              <div className="bg-amber-400" style={{ width: `${pct(data.cuotas.pendiente)}%` }} />
              <div className="bg-sky-400" style={{ width: `${pct(data.cuotas.exento)}%` }} />
            </div>
            <ul className="text-sm space-y-1">
              <li>✅ Pagadas: {data.cuotas.pagado} ({pct(data.cuotas.pagado)}%)</li>
              <li>⏳ Pendientes: {data.cuotas.pendiente} ({pct(data.cuotas.pendiente)}%)</li>
              <li>🎁 Exentas: {data.cuotas.exento} ({pct(data.cuotas.exento)}%)</li>
            </ul>
            <Link to="/admin/finanzas/cuotas" className="text-sm font-semibold text-coral underline">
              Ver socios con cuota pendiente →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos vencimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.impuestosTrimestreActual ? (
              <p>
                Impuesto {data.impuestosTrimestreActual.trimestre} {anio}: previsto{" "}
                <strong>{eur(data.impuestosTrimestreActual.importe_previsto)}</strong>, pendiente{" "}
                <strong>{eur(data.impuestosTrimestreActual.pendiente)}</strong>.
              </p>
            ) : (
              <p className="text-ink/60">Sin impuestos previstos para el trimestre en curso.</p>
            )}
            <div>
              <p className="font-semibold mb-1">Facturas emitidas pendientes de cobro</p>
              {data.facturasPendientes.length === 0 ? (
                <p className="text-ink/60">Ninguna. 🎉</p>
              ) : (
                <ul className="space-y-1">
                  {data.facturasPendientes.slice(0, 6).map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>
                        {f.numero_factura} · {f.entidad_nombre} · {fechaCorta(f.fecha_emision)}
                      </span>
                      <span className="font-semibold">{eur(f.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colaboraciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              Saldo total disponible: <strong>{eur(data.colaboraciones.saldoTotal)}</strong>
            </p>
            <p className="text-ink/60">Total gastado histórico: {eur(data.colaboraciones.gastadoTotal)}</p>
            <Link to="/admin/finanzas/colaboraciones" className="text-sm font-semibold text-coral underline">
              Ver cuentas →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
