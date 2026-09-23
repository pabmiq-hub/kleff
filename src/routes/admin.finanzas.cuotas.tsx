import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { finListCuotas, finSetCuota, type CuotaSocio } from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eur, fechaCorta, currentYear, yearOptions } from "@/lib/finanzas-ui";

export const Route = createFileRoute("/admin/finanzas/cuotas")({ component: CuotasPage });

function CuotasPage() {
  const list = useServerFn(finListCuotas);
  const setCuota = useServerFn(finSetCuota);
  const { canFinanzasWrite } = useAdminAccess();

  const [anio, setAnio] = useState(currentYear());
  const [rows, setRows] = useState<CuotaSocio[]>([]);
  const [q, setQ] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exento, setExento] = useState<CuotaSocio | null>(null);
  const [motivo, setMotivo] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await list({ data: { anio } })) as CuotaSocio[]);
    } finally {
      setLoading(false);
    }
  }, [list, anio]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const update = async (row: CuotaSocio, estado: CuotaSocio["estado"], motivoExencion?: string) => {
    try {
      await setCuota({
        data: {
          socio_id: row.socio_id,
          anio,
          estado,
          importe: row.importe,
          motivo_exencion: motivoExencion ?? null,
        },
      });
      toast.success("Cuota actualizada");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const filtered = rows.filter(
    (r) =>
      r.socio_nombre.toLowerCase().includes(q.toLowerCase()) &&
      (!soloPendientes || r.estado === "pendiente"),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
        <Input
          placeholder="Buscar socio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
          />
          Solo pendientes
        </label>
      </div>

      {loading ? (
        <p className="text-ink/60">Cargando…</p>
      ) : (
        <div className="rounded-xl border border-ink/10 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Socio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Fecha de pago</TableHead>
                {canFinanzasWrite && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.socio_id}>
                  <TableCell className="text-ink/50">{r.member_number ?? "—"}</TableCell>
                  <TableCell className="font-medium">{r.socio_nombre}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={r.estado} motivo={r.motivo_exencion} />
                  </TableCell>
                  <TableCell>{eur(r.importe)}</TableCell>
                  <TableCell>{fechaCorta(r.fecha_pago)}</TableCell>
                  {canFinanzasWrite && (
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      {r.estado !== "pagado" && (
                        <Button size="sm" variant="secondary" onClick={() => update(r, "pagado")}>
                          Marcar pagada
                        </Button>
                      )}
                      {r.estado !== "pendiente" && (
                        <Button size="sm" variant="ghost" onClick={() => update(r, "pendiente")}>
                          Pendiente
                        </Button>
                      )}
                      {r.estado !== "exento" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setExento(r);
                            setMotivo(r.motivo_exencion ?? "");
                          }}
                        >
                          Exenta
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(exento)} onOpenChange={(o) => !o && setExento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar cuota como exenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo de la exención</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Voluntariado, beca…" />
            <p className="text-xs text-ink/60">
              La exención se arrastra automáticamente a los años siguientes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExento(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (exento) await update(exento, "exento", motivo);
                setExento(null);
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

function EstadoBadge({ estado, motivo }: { estado: CuotaSocio["estado"]; motivo: string | null }) {
  const map = {
    pagado: "bg-emerald-100 text-emerald-800",
    pendiente: "bg-amber-100 text-amber-800",
    exento: "bg-sky-100 text-sky-800",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[estado]}`} title={motivo ?? ""}>
      {estado === "pagado" ? "Pagada" : estado === "pendiente" ? "Pendiente" : "Exenta"}
    </span>
  );
}
