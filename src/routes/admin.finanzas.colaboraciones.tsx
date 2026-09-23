import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  finListColaboraciones,
  finCreateCuentaColaboracion,
  finListAcciones,
  finCreateAccion,
  finDeleteAccion,
  type CuentaColaboracion,
  type AccionColaboracion,
} from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { eur, fechaCorta, todayISO } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/colaboraciones")({ component: ColaboracionesPage });

function ColaboracionesPage() {
  const list = useServerFn(finListColaboraciones);
  const createCuenta = useServerFn(finCreateCuentaColaboracion);
  const { canFinanzasWrite } = useAdminAccess();

  const [cuentas, setCuentas] = useState<CuentaColaboracion[]>([]);
  const [activa, setActiva] = useState<CuentaColaboracion | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "" });

  const reload = useCallback(async () => {
    const data = (await list()) as CuentaColaboracion[];
    setCuentas(data);
    setActiva((prev) => (prev ? (data.find((c) => c.id === prev.id) ?? null) : null));
  }, [list]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (activa) {
    return (
      <CuentaDetalle
        cuenta={activa}
        canWrite={canFinanzasWrite}
        onBack={() => setActiva(null)}
        onChanged={reload}
      />
    );
  }

  const saldoTotal = cuentas.reduce((s, c) => s + c.saldo, 0);
  const gastadoTotal = cuentas.reduce((s, c) => s + c.gastado, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p>
            Saldo total disponible: <strong>{eur(saldoTotal)}</strong>
          </p>
          <p className="text-ink/60">Total gastado histórico: {eur(gastadoTotal)}</p>
        </div>
        {canFinanzasWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir cuenta de colaboración
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cuentas.map((c) => (
          <Card key={c.id} className="cursor-pointer hover:border-coral/50" onClick={() => setActiva(c)}>
            <CardHeader>
              <CardTitle className="text-base">{c.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-display text-2xl font-bold">{eur(c.saldo)}</p>
              <p className="text-ink/60">
                Aportado {eur(c.aportado)} · gastado {eur(c.gastado)}
              </p>
              {c.descripcion && <p className="text-ink/60">{c.descripcion}</p>}
            </CardContent>
          </Card>
        ))}
        {cuentas.length === 0 && <p className="text-ink/60">Todavía no hay cuentas de colaboración.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta de colaboración</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.nombre}
              onClick={async () => {
                try {
                  await createCuenta({ data: { nombre: form.nombre, descripcion: form.descripcion || null } });
                  toast.success("Cuenta creada");
                  setOpen(false);
                  setForm({ nombre: "", descripcion: "" });
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo guardar");
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CuentaDetalle({
  cuenta,
  canWrite,
  onBack,
  onChanged,
}: {
  cuenta: CuentaColaboracion;
  canWrite: boolean;
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const list = useServerFn(finListAcciones);
  const create = useServerFn(finCreateAccion);
  const remove = useServerFn(finDeleteAccion);

  const [acciones, setAcciones] = useState<AccionColaboracion[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fecha: todayISO(), tipo: "aportacion", importe: "", descripcion: "" });

  const reload = useCallback(async () => {
    setAcciones((await list({ data: { cuenta_id: cuenta.id } })) as AccionColaboracion[]);
  }, [list, cuenta.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a las cuentas
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{cuenta.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-display text-3xl font-bold">{eur(cuenta.saldo)}</p>
          <p className="text-ink/60">
            Aportado {eur(cuenta.aportado)} · gastado {eur(cuenta.gastado)}
          </p>
        </CardContent>
      </Card>

      {canWrite && (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Añadir acción
        </Button>
      )}

      <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
        {acciones.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <p className="font-medium">
                {a.tipo === "aportacion" ? "Aportación" : "Gasto"} · {fechaCorta(a.fecha)}
              </p>
              <p className="text-ink/60">{a.descripcion ?? "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${a.tipo === "aportacion" ? "text-emerald-700" : "text-ink"}`}>
                {a.tipo === "aportacion" ? "+" : "−"}
                {eur(a.importe)}
              </span>
              {canWrite && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    await remove({ data: { id: a.id } });
                    await reload();
                    await onChanged();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {acciones.length === 0 && <p className="p-3 text-sm text-ink/60">Sin movimientos todavía.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="aportacion">Aportación</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Importe (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  await create({
                    data: {
                      cuenta_colaboracion_id: cuenta.id,
                      fecha: form.fecha,
                      tipo: form.tipo as "aportacion" | "gasto",
                      importe: Number(form.importe),
                      descripcion: form.descripcion || null,
                    },
                  });
                  toast.success("Acción registrada");
                  setOpen(false);
                  setForm({ fecha: todayISO(), tipo: "aportacion", importe: "", descripcion: "" });
                  await reload();
                  await onChanged();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo guardar");
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
