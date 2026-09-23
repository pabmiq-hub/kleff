import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  finListFacturas,
  finCreateFactura,
  finSetFacturaCobrada,
  finDeleteFactura,
  type Factura,
} from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { eur, fechaCorta, todayISO } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/facturas")({ component: FacturasPage });

const EMPTY = { fecha_emision: todayISO(), entidad_nombre: "", entidad_nif: "", base_imponible: "", porcentaje_iva: "21", concepto: "" };

function FacturasPage() {
  const list = useServerFn(finListFacturas);
  const create = useServerFn(finCreateFactura);
  const setCobrada = useServerFn(finSetFacturaCobrada);
  const remove = useServerFn(finDeleteFactura);
  const { canFinanzasWrite } = useAdminAccess();

  const [rows, setRows] = useState<Factura[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const reload = useCallback(async () => setRows((await list()) as Factura[]), [list]);
  useEffect(() => {
    void reload();
  }, [reload]);

  const base = Number(form.base_imponible) || 0;
  const iva = Math.round(((base * (Number(form.porcentaje_iva) || 0)) / 100) * 100) / 100;

  const submit = async () => {
    try {
      await create({
        data: {
          fecha_emision: form.fecha_emision,
          entidad_nombre: form.entidad_nombre,
          entidad_nif: form.entidad_nif || null,
          base_imponible: base,
          porcentaje_iva: Number(form.porcentaje_iva) || 0,
          concepto: form.concepto || null,
        },
      });
      toast.success("Factura creada");
      setOpen(false);
      setForm(EMPTY);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{rows.length} facturas emitidas</p>
        {canFinanzasWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva factura
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">IVA</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              {canFinanzasWrite && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs">{f.numero_factura}</TableCell>
                <TableCell>{fechaCorta(f.fecha_emision)}</TableCell>
                <TableCell>
                  <div className="font-medium">{f.entidad_nombre}</div>
                  <div className="text-xs text-ink/50">{f.entidad_nif ?? ""}</div>
                </TableCell>
                <TableCell className="text-right">{eur(f.base_imponible)}</TableCell>
                <TableCell className="text-right">
                  {eur(f.importe_iva)} <span className="text-ink/40 text-xs">({f.porcentaje_iva}%)</span>
                </TableCell>
                <TableCell className="text-right font-semibold">{eur(f.total)}</TableCell>
                <TableCell>
                  {f.estado === "cobrada" ? (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                      Cobrada {fechaCorta(f.fecha_cobro)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                      Pendiente
                    </span>
                  )}
                </TableCell>
                {canFinanzasWrite && (
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await setCobrada({ data: { id: f.id, cobrada: f.estado !== "cobrada" } });
                        await reload();
                      }}
                    >
                      {f.estado === "cobrada" ? "Marcar pendiente" : "Marcar cobrada"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await remove({ data: { id: f.id } });
                        await reload();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha de emisión</Label>
                <Input
                  type="date"
                  value={form.fecha_emision}
                  onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
                />
              </div>
              <div>
                <Label>NIF/CIF</Label>
                <Input value={form.entidad_nif} onChange={(e) => setForm({ ...form, entidad_nif: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Entidad</Label>
              <Input
                value={form.entidad_nombre}
                onChange={(e) => setForm({ ...form, entidad_nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Base imponible (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.base_imponible}
                  onChange={(e) => setForm({ ...form, base_imponible: e.target.value })}
                />
              </div>
              <div>
                <Label>IVA (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.porcentaje_iva}
                  onChange={(e) => setForm({ ...form, porcentaje_iva: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Concepto</Label>
              <Textarea value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
            </div>
            <p className="text-sm text-ink/70">
              IVA: <strong>{eur(iva)}</strong> · Total: <strong>{eur(base + iva)}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!form.entidad_nombre}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
