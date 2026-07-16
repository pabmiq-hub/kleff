import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listKleffMatches,
  createKleffMatch,
  searchLudoyaBoardgamesFn,
} from "@/lib/ludoya.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarDays, MapPin, Plus, Users, ExternalLink, RefreshCw, Search } from "lucide-react";

export const Route = createFileRoute("/app/partidas")({
  head: () => ({
    meta: [
      { title: "Partidas — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PartidasPage,
});

interface UiMatch {
  id: string;
  title?: string | null;
  scheduledAt?: string | null;
  location?: string | null;
  notes?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  boardgame?: { name?: string; slug?: string; imageUrl?: string | null } | null;
  createdBy?: { username?: string; name?: string } | null;
  participants?: Array<{ username?: string; name?: string }> | null;
  url?: string | null;
}

function PartidasPage() {
  const listFn = useServerFn(listKleffMatches);
  const createFn = useServerFn(createKleffMatch);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<UiMatch[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await listFn({ data: undefined as never });
      setMatches((r.matches ?? []) as UiMatch[]);
      setWarning(r.endpointOk ? null : r.lastError ?? "Sincronización con Ludoya no disponible todavía");
    } catch (err) {
      setWarning(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Partidas</h1>
          <p className="text-muted-foreground mt-1">
            Eventos y partidas del grupo de KLEFF en Ludoya.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Crear partida
              </Button>
            </DialogTrigger>
            <CreateMatchDialog
              onSubmit={async (payload) => {
                await createFn({ data: payload });
                toast.success("Partida creada en Ludoya");
                setDialogOpen(false);
                void load();
              }}
            />
          </Dialog>
        </div>
      </header>

      {warning && (
        <div className="bg-cream border-2 border-ink/20 rounded-2xl p-4 text-sm text-muted-foreground">
          <p>
            <strong>Sincronización con Ludoya:</strong> {warning}
          </p>
          <p className="mt-1">
            Cuando confirmemos los endpoints oficiales de partidas, esta lista se
            rellenará automáticamente y la creación se publicará en el grupo.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : matches.length === 0 ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 shadow-tactile-sm text-center">
          <p className="font-display text-xl font-bold">Sin partidas por ahora</p>
          <p className="text-muted-foreground text-sm mt-1">
            Sé el primero en proponer una partida al grupo de KLEFF.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: UiMatch }) {
  const when = match.scheduledAt ? new Date(match.scheduledAt) : null;
  return (
    <article className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm space-y-2">
      <header className="flex gap-3">
        {match.boardgame?.imageUrl && (
          <img
            src={match.boardgame.imageUrl}
            alt=""
            className="h-14 w-14 rounded-lg object-cover border border-ink/10"
          />
        )}
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold leading-tight">
            {match.title || match.boardgame?.name || "Partida"}
          </h3>
          {match.boardgame?.name && match.title && (
            <p className="text-xs text-muted-foreground">{match.boardgame.name}</p>
          )}
        </div>
      </header>
      <ul className="text-sm text-muted-foreground space-y-1">
        {when && (
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {when.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
          </li>
        )}
        {match.location && (
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> {match.location}
          </li>
        )}
        {(match.minPlayers || match.maxPlayers) && (
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {match.minPlayers ?? "?"}–{match.maxPlayers ?? "?"} jugadores
            {match.participants && ` · ${match.participants.length} apuntados`}
          </li>
        )}
      </ul>
      {match.notes && <p className="text-sm">{match.notes}</p>}
      {match.url && (
        <a
          href={match.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm inline-flex items-center gap-1 text-coral-deep font-semibold hover:underline"
        >
          Ver en Ludoya <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </article>
  );
}

interface BgOption {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

function CreateMatchDialog({
  onSubmit,
}: {
  onSubmit: (payload: {
    title: string;
    scheduledAt: string;
    boardgameId?: string | null;
    boardgameSlug?: string | null;
    boardgameName?: string | null;
    minPlayers?: number | null;
    maxPlayers?: number | null;
    location?: string | null;
    notes?: string | null;
  }) => Promise<void>;
}) {
  const searchFn = useServerFn(searchLudoyaBoardgamesFn);

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [minPlayers, setMinPlayers] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<string>("");

  const [bgQuery, setBgQuery] = useState("");
  const [bgResults, setBgResults] = useState<BgOption[]>([]);
  const [bgSearching, setBgSearching] = useState(false);
  const [bg, setBg] = useState<BgOption | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length >= 2 && scheduledAt.length >= 4,
    [title, scheduledAt],
  );

  const runSearch = async () => {
    if (bgQuery.trim().length < 2) return;
    setBgSearching(true);
    try {
      const r = await searchFn({ data: { query: bgQuery.trim() } });
      setBgResults(
        (r.results ?? []).map((g) => ({
          id: g.id,
          slug: g.slug,
          name: g.name,
          imageUrl: g.imageUrl,
        })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error buscando");
    } finally {
      setBgSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        boardgameId: bg?.id ?? null,
        boardgameSlug: bg?.slug ?? null,
        boardgameName: bg?.name ?? null,
        minPlayers: minPlayers ? Number(minPlayers) : null,
        maxPlayers: maxPlayers ? Number(maxPlayers) : null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nueva partida</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Noche de Wingspan" required />
        </div>
        <div className="space-y-2">
          <Label>Fecha y hora</Label>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Juego (opcional)</Label>
          {bg ? (
            <div className="flex items-center gap-2 border-2 border-ink rounded-lg p-2">
              {bg.imageUrl && <img src={bg.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
              <span className="flex-1 text-sm font-medium">{bg.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setBg(null)}>Cambiar</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={bgQuery}
                  onChange={(e) => setBgQuery(e.target.value)}
                  placeholder="Buscar en Ludoya…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); void runSearch(); }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => void runSearch()} disabled={bgSearching || bgQuery.trim().length < 2}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {bgResults.length > 0 && (
                <ul className="border-2 border-ink rounded-lg divide-y divide-ink/10 max-h-52 overflow-y-auto">
                  {bgResults.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => { setBg(g); setBgResults([]); setBgQuery(""); }}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-primary-soft/20"
                      >
                        {g.imageUrl && <img src={g.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                        <span className="text-sm">{g.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Jugadores mín.</Label>
            <Input type="number" min={1} max={50} value={minPlayers} onChange={(e) => setMinPlayers(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Jugadores máx.</Label>
            <Input type="number" min={1} max={50} value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Lugar (opcional)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Local KLEFF, Hugo's Diner…" />
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Creando…" : "Crear partida"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
