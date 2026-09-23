import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  finListAportaciones,
  finCreateAportacion,
  finDeleteAportacion,
  finListCategorias,
  type Aportacion,
  type Categoria,
} from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { eur, fechaCorta, todayISO } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/aportaciones")({ component: AportacionesPage });

function AportacionesPage() {
  const list = useServerFn(finListAportaciones);
  const save = useServerFn(finCreateAportacion);
  const remove = useServerFn(finDeleteAportacion);
  const listCats = useServerFn(finListCategorias);
  const { canFinanzasWrite } = useAdminAccess();

  const [rows, setRows] = useState<Aportacion[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fecha: todayISO(), importe: "", categoria_id: "", concepto: "" });

  const reload = useCallback(async () => {
    const [a, c] = await Promise.all([list(), listCats()]);
    setRows(a as Aportacion[]);
    setCats((c as Categoria[]).filter((x) => x.tipo === "ingreso"));
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
          concepto: form.concepto || null,
        },
      });
      toast.success("Aportación registrada");
      setOpen(false);
      setForm({ fecha: todayISO(), importe: "", categoria_id: "", concepto: "" });
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
          {rows.length} aportaciones · total <strong>{eur(total)}</strong>
        </p>
        {canFinanzasWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir aportación
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-ink/10 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              {canFinanzasWrite && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{fechaCorta(r.fecha)}</TableCell>
                <TableCell>{r.concepto ?? "—"}</TableCell>
                <TableCell>{catName(r.categoria_id)}</TableCell>
                <TableCell className="text-right font-semibold">{eur(r.importe)}</TableCell>
                {canFinanzasWrite && (
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await remove({ data: { id: r.id } });
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
            <DialogTitle>Nueva aportación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
              <Label>Concepto</Label>
              <Input value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
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
