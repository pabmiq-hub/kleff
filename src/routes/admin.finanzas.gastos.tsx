import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  finListGastos,
  finCreateGasto,
  finDeleteGasto,
  finListCategorias,
  type Gasto,
  type Categoria,
} from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImagePicker } from "@/components/cms/ImagePicker";
import { Plus, Trash2 } from "lucide-react";
import { eur, fechaCorta, todayISO } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/gastos")({ component: GastosPage });

const EMPTY = { fecha: todayISO(), importe: "", categoria_id: "", descripcion: "", proveedor: "", adjunto_url: "" };

function GastosPage() {
  const list = useServerFn(finListGastos);
  const save = useServerFn(finCreateGasto);
  const remove = useServerFn(finDeleteGasto);
  const listCats = useServerFn(finListCategorias);
  const { canFinanzasWrite } = useAdminAccess();

  const [rows, setRows] = useState<Gasto[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const reload = useCallback(async () => {
    const [g, c] = await Promise.all([list(), listCats()]);
    setRows(g as Gasto[]);
    setCats((c as Categoria[]).filter((x) => x.tipo === "gasto"));
  }, [list, listCats]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submit = async () => {
    try {
      await save({
        data: {
          fecha: form.fecha,
          importe: Number(form.importe),
          categoria_id: form.categoria_id || null,
          descripcion: form.descripcion || null,
          proveedor: form.proveedor || null,
          adjunto_url: form.adjunto_url || null,
        },
      });
      toast.success("Gasto registrado");
      setOpen(false);
      setForm(EMPTY);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const catName = (id: string | null) => cats.find((c) => c.id === id)?.nombre ?? "—";
  const total = rows.reduce((s, r) => s + r.importe, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">
          {rows.length} gastos · total <strong>{eur(total)}</strong>
        </p>
        {canFinanzasWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir gasto
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Justificante</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              {canFinanzasWrite && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{fechaCorta(g.fecha)}</TableCell>
                <TableCell>{g.descripcion ?? "—"}</TableCell>
                <TableCell>{catName(g.categoria_id)}</TableCell>
                <TableCell>{g.proveedor ?? "—"}</TableCell>
                <TableCell>
                  {g.adjunto_url ? (
                    <a href={g.adjunto_url} target="_blank" rel="noreferrer" className="text-coral underline text-xs">
                      Ver
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">{eur(g.importe)}</TableCell>
                {canFinanzasWrite && (
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await remove({ data: { id: g.id } });
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
            <DialogTitle>Nuevo gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
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
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm"
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              >
                <option value="">Sin categoría</option>
                {cats
                  .filter((c) => c.activa)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div>
              <Label>Proveedor</Label>
              <Input value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
            </div>
            <div>
              <Label>Justificante (opcional)</Label>
              <ImagePicker
                value={form.adjunto_url}
                onChange={(url) => setForm({ ...form, adjunto_url: url ?? "" })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
