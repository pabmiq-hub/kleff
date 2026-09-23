import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { finListCategorias, finUpsertCategoria, type Categoria } from "@/lib/finanzas.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/finanzas/categorias")({ component: CategoriasPage });

function CategoriasPage() {
  const list = useServerFn(finListCategorias);
  const upsert = useServerFn(finUpsertCategoria);
  const { canFinanzasWrite } = useAdminAccess();

  const [rows, setRows] = useState<Categoria[]>([]);
  const [nuevo, setNuevo] = useState<Record<"ingreso" | "gasto", string>>({ ingreso: "", gasto: "" });

  const reload = useCallback(async () => setRows((await list()) as Categoria[]), [list]);
  useEffect(() => {
    void reload();
  }, [reload]);

  const guardar = async (data: { id?: string; nombre: string; tipo: "ingreso" | "gasto"; activa: boolean }) => {
    try {
      await upsert({ data });
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const bloque = (tipo: "ingreso" | "gasto") => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{tipo === "ingreso" ? "Categorías de ingreso" : "Categorías de gasto"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows
          .filter((c) => c.tipo === tipo)
          .map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Input
                defaultValue={c.nombre}
                disabled={!canFinanzasWrite}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== c.nombre)
                    void guardar({ id: c.id, nombre: e.target.value, tipo, activa: c.activa });
                }}
              />
              <Switch
                checked={c.activa}
                disabled={!canFinanzasWrite}
                onCheckedChange={(v) => void guardar({ id: c.id, nombre: c.nombre, tipo, activa: v })}
              />
            </div>
          ))}
        {canFinanzasWrite && (
          <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
            <Input
              placeholder="Nueva categoría…"
              value={nuevo[tipo]}
              onChange={(e) => setNuevo({ ...nuevo, [tipo]: e.target.value })}
            />
            <Button
              size="icon"
              disabled={!nuevo[tipo].trim()}
              onClick={async () => {
                await guardar({ nombre: nuevo[tipo], tipo, activa: true });
                setNuevo({ ...nuevo, [tipo]: "" });
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        Desactivar una categoría la oculta en los formularios pero conserva el histórico.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {bloque("ingreso")}
        {bloque("gasto")}
      </div>
    </div>
  );
}
