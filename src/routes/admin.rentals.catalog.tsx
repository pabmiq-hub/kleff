import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRentalGames, createRentalGame, updateRentalGame, deleteRentalGame } from "@/server/rental.functions";
import { adminSyncBggCollection } from "@/server/bgg.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/rentals/catalog")({
  component: CatalogPage,
});

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  max_rental_days: number;
  total_copies: number;
  is_active: boolean;
}

function CatalogPage() {
  const listFn = useServerFn(listRentalGames);
  const createFn = useServerFn(createRentalGame);
  const updateFn = useServerFn(updateRentalGame);
  const deleteFn = useServerFn(deleteRentalGame);
  const syncFn = useServerFn(adminSyncBggCollection);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", maxRentalDays: 14, totalCopies: 1 });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await syncFn();
      toast.success(`Sync BGG OK: ${r.upserted} juegos · ${r.removedInactive} desactivados`);
      await refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Sync falló: ${err.message}. Si estás en preview, prueba en producción (BGG bloquea IPs de desarrollo).`
          : "Error",
      );
    } finally {
      setSyncing(false);
    }
  };

  const refresh = async () => {
    const r = await listFn({ data: undefined as never });
    setGames(r.games as Game[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFn({
        data: {
          title: form.title,
          description: form.description || null,
          imageUrl: form.imageUrl || null,
          maxRentalDays: form.maxRentalDays,
          totalCopies: form.totalCopies,
          isActive: true,
        },
      });
      toast.success("Juego añadido");
      setForm({ title: "", description: "", imageUrl: "", maxRentalDays: 14, totalCopies: 1 });
      setShowForm(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const toggleActive = async (g: Game) => {
    try {
      await updateFn({ data: { id: g.id, isActive: !g.is_active } });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este juego del catálogo?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Eliminado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <p className="text-cream/60">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          className="border-cream/30 text-cream hover:bg-cream/10"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando…" : "Sincronizar BGG"}
        </Button>
        <Button className="bg-coral hover:bg-coral-deep text-cream" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Añadir juego
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-cream/5 border border-cream/15 rounded-2xl p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-cream/80">Título</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-cream/10 border-cream/20 text-cream" />
            </div>
            <div className="space-y-1">
              <Label className="text-cream/80">URL imagen</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="bg-cream/10 border-cream/20 text-cream" />
            </div>
            <div className="space-y-1">
              <Label className="text-cream/80">Días máx. alquiler</Label>
              <Input type="number" min={1} max={180} value={form.maxRentalDays} onChange={(e) => setForm({ ...form, maxRentalDays: Number(e.target.value) })} className="bg-cream/10 border-cream/20 text-cream" />
            </div>
            <div className="space-y-1">
              <Label className="text-cream/80">Nº copias</Label>
              <Input type="number" min={1} max={99} value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: Number(e.target.value) })} className="bg-cream/10 border-cream/20 text-cream" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-cream/80">Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-cream/10 border-cream/20 text-cream" />
          </div>
          <Button type="submit" className="bg-coral hover:bg-coral-deep text-cream">Guardar</Button>
        </form>
      )}

      <div className="space-y-2">
        {games.length === 0 && (
          <div className="bg-cream/5 border border-cream/15 rounded-2xl p-8 text-center text-cream/50">
            Catálogo vacío. Añade el primer juego.
          </div>
        )}
        {games.map((g) => (
          <div key={g.id} className="bg-cream/5 border border-cream/15 rounded-2xl p-4 flex items-center gap-4">
            {g.image_url ? (
              <img src={g.image_url} alt="" className="h-14 w-14 rounded-lg object-cover border border-cream/20" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-coral/30 flex items-center justify-center font-bold text-cream">🎲</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{g.title}</p>
              <p className="text-xs text-cream/60">
                {g.total_copies} copia{g.total_copies !== 1 ? "s" : ""} · máx {g.max_rental_days} días
              </p>
            </div>
            <Button size="sm" variant="ghost" className="text-cream/70 hover:text-cream hover:bg-cream/10" onClick={() => toggleActive(g)}>
              {g.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button size="sm" variant="ghost" className="text-coral hover:text-cream hover:bg-coral/30" onClick={() => remove(g.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
