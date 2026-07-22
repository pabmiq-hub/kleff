import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRentalGames, updateRentalGame, deleteRentalGame } from "@/lib/rental.functions";
import { adminSyncBggCollection } from "@/lib/bgg.functions";
import {
  listFeaturedGames,
  createFeaturedGame,
  deleteFeaturedGame,
} from "@/lib/featured.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { LocationBadge } from "@/components/ludoteca/LocationBadge";
import { toast } from "sonner";
import { Trash2, RefreshCw, MapPin, Star } from "lucide-react";
import type { DateRange } from "react-day-picker";

export const Route = createFileRoute("/admin/rentals/catalog")({
  component: CatalogPage,
});

interface FeaturedRow {
  id: string;
  game_id: string;
  start_date: string;
  end_date: string;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatEs(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Game {
  id: string;
  title: string;
  image_url: string | null;
  max_rental_days: number;
  total_copies: number;
  is_active: boolean;
  shelf: "A" | "B" | "C" | "D" | "1" | "2" | "3" | "4" | "on_demand" | "drawer" | null;
  shape: "triangle" | "heart" | "square" | null;
  slot_number: number | null;
  drawer_number: number | null;
  drawer_letter: "a" | "b" | "c" | "d" | null;
  shelf_color: "green" | "pink" | "red" | "yellow" | "blue" | null;
}


function CatalogPage() {
  const listFn = useServerFn(listRentalGames);
  const updateFn = useServerFn(updateRentalGame);
  const deleteFn = useServerFn(deleteRentalGame);
  const syncFn = useServerFn(adminSyncBggCollection);

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [shelfFilter, setShelfFilter] = useState<string>("all");

  const refresh = async () => {
    const r = await listFn({ data: undefined as never });
    setGames(r.games as Game[]);
  };

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await syncFn();
      toast.success(`Sync BGG: ${r.upserted} juegos · ${r.removedInactive} desactivados`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSyncing(false);
    }
  };

  const updateCopies = async (g: Game, copies: number) => {
    try {
      await updateFn({ data: { id: g.id, totalCopies: copies } });
      setGames((arr) => arr.map((x) => (x.id === g.id ? { ...x, total_copies: copies } : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const toggleActive = async (g: Game) => {
    try {
      await updateFn({ data: { id: g.id, isActive: !g.is_active } });
      setGames((arr) => arr.map((x) => (x.id === g.id ? { ...x, is_active: !x.is_active } : x)));
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

  const filtered = games.filter((g) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (shelfFilter === "all") return true;
    if (shelfFilter === "unset") return !g.shelf;
    return g.shelf === shelfFilter;
  });

  if (loading) return <p className="text-ink/60">Cargando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="bg-ink/10 border-ink/20 text-ink max-w-xs"
        />
        <Select value={shelfFilter} onValueChange={setShelfFilter}>
          <SelectTrigger className="bg-ink/10 border-ink/20 text-ink w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ubicaciones</SelectItem>
            <SelectItem value="unset">Sin ubicar</SelectItem>
            <SelectItem value="A">Estantería A</SelectItem>
            <SelectItem value="B">Estantería B</SelectItem>
            <SelectItem value="C">Estantería C</SelectItem>
            <SelectItem value="D">Estantería D</SelectItem>
            <SelectItem value="drawer">Cajón</SelectItem>
            <SelectItem value="on_demand">Bajo pedido</SelectItem>
          </SelectContent>

        </Select>
        <span className="text-xs text-ink/60">{filtered.length} / {games.length}</span>
        <div className="ml-auto">
          <Button
            variant="outline"
            className="border-ink/30 text-ink hover:bg-ink/10"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando…" : "Sincronizar BGG"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((g) => (
          <div key={g.id} className="bg-ink/5 border border-ink/15 rounded-2xl p-3 flex flex-wrap items-center gap-3">
            {g.image_url ? (
              <img src={g.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border border-ink/20" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-coral/30 flex items-center justify-center font-bold text-ink">🎲</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{g.title}</p>
              <p className="text-xs text-ink/60">máx {g.max_rental_days} días</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-ink/60">Copias</Label>
              <Input
                type="number"
                min={1}
                max={99}
                value={g.total_copies}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(99, Number(e.target.value) || 1));
                  setGames((arr) => arr.map((x) => (x.id === g.id ? { ...x, total_copies: n } : x)));
                }}
                onBlur={(e) => updateCopies(g, Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-16 bg-ink/10 border-ink/20 text-ink"
              />
            </div>
            <div className="flex items-center">
              <LocationBadge loc={g} />
            </div>
            <LocationDialog game={g} onSaved={refresh} updateFn={updateFn} />
            <Button size="sm" variant="ghost" className="text-ink/70 hover:text-ink hover:bg-ink/10" onClick={() => toggleActive(g)}>
              {g.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button size="sm" variant="ghost" className="text-coral hover:text-ink hover:bg-coral/30" onClick={() => remove(g.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationDialog({
  game,
  onSaved,
  updateFn,
}: {
  game: Game;
  onSaved: () => Promise<void>;
  updateFn: ReturnType<typeof useServerFn<typeof updateRentalGame>>;
}) {
  const [open, setOpen] = useState(false);
  const [shelf, setShelf] = useState<Game["shelf"]>(game.shelf);
  const [shape, setShape] = useState<Game["shape"]>(game.shape);
  const [color, setColor] = useState<Game["shelf_color"]>(game.shelf_color);
  const [slot, setSlot] = useState<number | null>(game.slot_number);
  const [drawerNum, setDrawerNum] = useState<number | null>(game.drawer_number);
  const [drawerLet, setDrawerLet] = useState<Game["drawer_letter"]>(game.drawer_letter);

  const isShelfAD =
    shelf === "A" || shelf === "B" || shelf === "C" || shelf === "D" ||
    shelf === "1" || shelf === "2" || shelf === "3" || shelf === "4";
  const isDrawer = shelf === "drawer";

  const save = async () => {
    try {
      await updateFn({
        data: {
          id: game.id,
          shelf: shelf ?? null,
          shape: isShelfAD ? shape ?? null : null,
          shelfColor: isShelfAD ? color ?? null : null,
          slotNumber: isShelfAD ? slot ?? null : null,
          drawerNumber: isDrawer ? drawerNum ?? null : null,
          drawerLetter: isDrawer ? drawerLet ?? null : null,
        },
      });
      toast.success("Ubicación guardada");
      setOpen(false);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-ink/30 text-ink hover:bg-ink/10">
          <MapPin className="h-3.5 w-3.5 mr-1" /> Ubicación
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubicar “{game.title}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Estantería</Label>
            <Select value={shelf ?? ""} onValueChange={(v) => setShelf((v || null) as Game["shelf"])}>
              <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Estantería A</SelectItem>
                <SelectItem value="B">Estantería B</SelectItem>
                <SelectItem value="C">Estantería C</SelectItem>
                <SelectItem value="D">Estantería D</SelectItem>
                <SelectItem value="drawer">Cajón</SelectItem>
                <SelectItem value="on_demand">Bajo pedido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isShelfAD && (
            <>
              <div className="space-y-1">
                <Label>Forma</Label>
                <Select value={shape ?? ""} onValueChange={(v) => setShape((v || null) as Game["shape"])}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="triangle">Triángulo</SelectItem>
                    <SelectItem value="heart">Corazón</SelectItem>
                    <SelectItem value="square">Cuadrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <Select value={color ?? ""} onValueChange={(v) => setColor((v || null) as Game["shelf_color"])}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="pink">Rosa</SelectItem>
                    <SelectItem value="red">Rojo</SelectItem>
                    <SelectItem value="yellow">Amarillo</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Número (1-5)</Label>
                <Input type="number" min={1} max={5} value={slot ?? ""} onChange={(e) => setSlot(e.target.value ? Number(e.target.value) : null)} />
              </div>
            </>
          )}

          {isDrawer && (
            <>
              <div className="space-y-1">
                <Label>Número de cajón (1-4)</Label>
                <Input type="number" min={1} max={4} value={drawerNum ?? ""} onChange={(e) => setDrawerNum(e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className="space-y-1">
                <Label>Letra (a-d)</Label>
                <Select value={drawerLet ?? ""} onValueChange={(v) => setDrawerLet((v || null) as Game["drawer_letter"])}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={save} className="w-full bg-coral hover:bg-coral-deep text-ink">Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

