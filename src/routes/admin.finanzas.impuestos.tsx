import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  finListImpuestos,
  finAddPagoImpuesto,
  finDeletePagoImpuesto,
  finSetImpuesto,
  type ImpuestoTrimestre,
} from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { eur, fechaCorta, todayISO, currentYear, yearOptions } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/impuestos")({ component: ImpuestosPage });

function ImpuestosPage() {
  const list = useServerFn(finListImpuestos);
  const addPago = useServerFn(finAddPagoImpuesto);
  const delPago = useServerFn(finDeletePagoImpuesto);
  const setImpuesto = useServerFn(finSetImpuesto);
  const { canFinanzasWrite } = useAdminAccess();

  const [anio, setAnio] = useState(currentYear());
  const [rows, setRows] = useState<ImpuestoTrimestre[]>([]);
  const [pagoFor, setPagoFor] = useState<ImpuestoTrimestre | null>(null);
  const [pago, setPago] = useState({ fecha_pago: todayISO(), importe_pagado: "", referencia: "" });

  const reload = useCallback(async () => {
    setRows((await list({ data: { anio } })) as ImpuestoTrimestre[]);
  }, [list, anio]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitPago = async () => {
    if (!pagoFor) return;
    try {
      await addPago({
        data: {
          impuesto_previsto_id: pagoFor.id,
          fecha_pago: pago.fecha_pago,
          importe_pagado: Number(pago.importe_pagado),
          referencia: pago.referencia || null,
        },
      });
      toast.success("Pago registrado");
      setPagoFor(null);
      setPago({ fecha_pago: todayISO(), importe_pagado: "", referencia: "" });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-ink/60">Año</Label>
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

      <p className="text-sm text-ink/60">
        La previsión de cada trimestre se calcula automáticamente con el IVA de las facturas emitidas en ese
        periodo.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id} className={r.pendiente > 0 && r.estado !== "conciliado" ? "border-amber-300" : ""}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                {r.trimestre} {r.anio}
              </CardTitle>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.estado === "conciliado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {r.estado === "conciliado" ? "Conciliado" : "Previsto"}
              </span>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-ink/60">Base imponible</p>
                  <p className="font-semibold">{eur(r.base_imponible_total)}</p>
                </div>
                <div>
                  <p className="text-ink/60">IVA repercutido</p>
                  <p className="font-semibold">{eur(r.iva_repercutido_total)}</p>
                </div>
                <div>
                  <p className="text-ink/60">Previsto</p>
                  <p className="font-semibold">{eur(r.importe_previsto)}</p>
                </div>
                <div>
                  <p className="text-ink/60">Pagado</p>
                  <p className="font-semibold">{eur(r.pagado)}</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${r.importe_previsto > 0 ? Math.min(100, (r.pagado / r.importe_previsto) * 100) : 0}%`,
                  }}
                />
              </div>
              {r.pendiente > 0.009 && (
                <p className="text-amber-700 font-semibold">Pendiente: {eur(r.pendiente)}</p>
              )}
              {r.pendiente < -0.009 && (
                <p className="text-sky-700 font-semibold">Pagado de más: {eur(-r.pendiente)}</p>
              )}

              {r.pagos.length > 0 && (
                <ul className="space-y-1 border-t border-ink/10 pt-2">
                  {r.pagos.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span>
                        {fechaCorta(p.fecha_pago)} · {eur(p.importe_pagado)}{" "}
                        <span className="text-ink/50">{p.referencia ?? ""}</span>
                      </span>
                      {canFinanzasWrite && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            await delPago({ data: { id: p.id } });
                            await reload();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canFinanzasWrite && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => setPagoFor(r)}>
                    <Plus className="h-4 w-4 mr-1" /> Añadir pago
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await setImpuesto({
                        data: { id: r.id, estado: r.estado === "conciliado" ? "previsto" : "conciliado" },
                      });
                      await reload();
                    }}
                  >
                    {r.estado === "conciliado" ? "Reabrir" : "Marcar conciliado"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(pagoFor)} onOpenChange={(o) => !o && setPagoFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago {pagoFor?.trimestre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={pago.fecha_pago}
                onChange={(e) => setPago({ ...pago, fecha_pago: e.target.value })}
              />
            </div>
            <div>
              <Label>Importe (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={pago.importe_pagado}
                onChange={(e) => setPago({ ...pago, importe_pagado: e.target.value })}
              />
            </div>
            <div>
              <Label>Referencia / justificante</Label>
              <Input value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPagoFor(null)}>
              Cancelar
            </Button>
            <Button onClick={submitPago}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
