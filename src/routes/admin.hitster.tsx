import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Music, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeHitsterSlug, type HitsterSide } from "@/lib/hitster";
import {
  hitsterAdminCreate,
  hitsterAdminDelete,
  hitsterAdminDuplicate,
  hitsterAdminList,
} from "@/lib/hitster.functions";
import { HitsterHostPanel } from "@/components/hitster/HitsterHostPanel";

export const Route = createFileRoute("/admin/hitster")({
  head: () => ({
    meta: [
      { title: "Hitster · Administración — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHitsterPage,
});

const STATUS_BADGE: Record<string, string> = {
  draft: "Borrador",
  playing: "En juego",
  tiebreak: "Desempate",
  finished: "Finalizada",
};

function AdminHitsterPage() {
  const [qc] = useState(() => new QueryClient());
  return <QueryClientProvider client={qc}><AdminHitsterInner /></QueryClientProvider>;
}

function AdminHitsterInner() {
  const qc = useQueryClient();
  const listFn = useServerFn(hitsterAdminList);
  const createFn = useServerFn(hitsterAdminCreate);
  const dupFn = useServerFn(hitsterAdminDuplicate);
  const delFn = useServerFn(hitsterAdminDelete);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [side, setSide] = useState<HitsterSide>("A");
  const [timerSec, setTimerSec] = useState(30);

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["hitster-admin-list"],
    queryFn: () => listFn(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["hitster-admin-list"] });

  const createM = useMutation({
    mutationFn: () => createFn({ data: { title, slug: slug || title, side, timer_seconds: timerSec } }),
    onSuccess: (res) => {
      toast.success("Partida creada");
      setCreateOpen(false);
      setTitle("");
      setSlug("");
      setSide("A");
      setTimerSec(30);
      refresh();
      setSelectedId(res.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dupM = useMutation({
    mutationFn: (id: string) => dupFn({ data: { id } }),
    onSuccess: () => { toast.success("Partida copiada"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Partida eliminada"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (selectedId) {
    return <HitsterHostPanel gameId={selectedId} onBack={() => { setSelectedId(null); refresh(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" /> Hitster
          </h1>
          <p className="text-sm text-muted-foreground">Crea y gestiona partidas de bingo musical con Cara A o Cara B.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Nueva partida
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando partidas…</p>
      ) : games.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center space-y-3">
          <Music className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="font-medium">Todavía no hay partidas de Hitster</p>
          <Button onClick={() => setCreateOpen(true)}>Crear primera partida</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {games.map((g) => (
            <div
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{g.title}</p>
                  <Badge variant="outline">Cara {g.side}</Badge>
                  <Badge variant={g.status === "playing" ? "default" : "secondary"}>
                    {STATUS_BADGE[g.status] ?? g.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  kleff.es/{g.slug} · {g.participants} jugadores · {g.timer_seconds}s
                </p>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button size="icon" variant="ghost" title="Gestionar" aria-label="Gestionar" onClick={() => setSelectedId(g.id)}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" title="Copiar partida" aria-label="Copiar partida" onClick={() => dupM.mutate(g.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Eliminar partida"
                  aria-label="Eliminar partida"
                  onClick={() => { if (confirm(`¿Eliminar la partida "${g.title}"?`)) delM.mutate(g.id); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva partida de Hitster</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createM.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-title">Nombre de la partida</Label>
              <Input
                id="new-title"
                required
                placeholder="Ej. Hitster Viernes KLEFF"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(normalizeHitsterSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-slug">Enlace corto (kleff.es/…)</Label>
              <Input
                id="new-slug"
                required
                placeholder="hitster-viernes"
                value={slug}
                onChange={(e) => setSlug(normalizeHitsterSlug(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cara del casette</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={side === "A" ? "default" : "outline"} onClick={() => setSide("A")}>
                  Cara A · Principiante
                </Button>
                <Button type="button" variant={side === "B" ? "default" : "outline"} onClick={() => setSide("B")}>
                  Cara B · Experto
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-timer">Tiempo por ronda (segundos)</Label>
              <Input
                id="new-timer"
                type="number"
                min={5}
                max={300}
                value={timerSec}
                onChange={(e) => setTimerSec(Math.max(5, Math.min(300, Number(e.target.value) || 30)))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createM.isPending}>
              Crear partida
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}