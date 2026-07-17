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
import { CalendarDays, MapPin, Plus, Users, ExternalLink, RefreshCw, Search, Layers, Trophy, Dice5, Sparkles } from "lucide-react";

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
  type: string;
  title?: string | null;
  scheduledAt?: string | null;
  location?: string | null;
  capacity?: number | null;
  participantCount?: number | null;
  maxPlayers?: number | null;
  minPlayers?: number | null;
  parentEvent?: { id: string; title?: string | null } | null;
  url?: string | null;
}

function classify(type: string): "partida" | "torneo" | "evento" {
  if (type === "PLANNED_PLAY") return "partida";
  if (type === "TOURNAMENT") return "torneo";
  return "evento";
}

function PartidasPage() {
  const listFn = useServerFn(listKleffMatches);
  const createFn = useServerFn(createKleffMatch);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<UiMatch[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"todos" | "partida" | "torneo" | "evento">("todos");

  const load = async () => {
    setRefreshing(true);
    try {
      const r = await listFn({ data: undefined as never });
      setItems((r.matches ?? []) as UiMatch[]);
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

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      }),
    [items],
  );
  const counts = useMemo(
    () => ({
      todos: sorted.length,
      partida: sorted.filter((m) => classify(m.type) === "partida").length,
      torneo: sorted.filter((m) => classify(m.type) === "torneo").length,
      evento: sorted.filter((m) => classify(m.type) === "evento").length,
    }),
    [sorted],
  );
  // Build parent event lookup for showing "dentro de X" chip
  const parentById = useMemo(() => {
    const m = new Map<string, UiMatch>();
    for (const it of sorted) if (classify(it.type) === "evento") m.set(it.id, it);
    return m;
  }, [sorted]);

  const visible = useMemo(() => {
    if (filter === "todos") return sorted;
    return sorted.filter((m) => classify(m.type) === filter);
  }, [sorted, filter]);

  const isEmpty = visible.length === 0;

  const filterOptions: { key: typeof filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "evento", label: "Eventos" },
    { key: "torneo", label: "Torneos" },
    { key: "partida", label: "Partidas" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Partidas y eventos</h1>
          <p className="text-muted-foreground mt-1">
            Actividad del grupo de KLEFF en Ludoya.
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
          <strong>Aviso:</strong> {warning}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => {
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors ${
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 bg-card text-ink hover:border-ink/50"
              }`}
            >
              {opt.label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${active ? "bg-cream/20" : "bg-ink/10"}`}>
                {counts[opt.key]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : isEmpty ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 shadow-tactile-sm text-center">
          <p className="text-muted-foreground text-sm">
            {counts.todos === 0
              ? "Aún no hay actividad programada en el grupo de KLEFF."
              : "No hay elementos en este filtro."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m) => (
            <ActivityCard
              key={m.id}
              match={m}
              parent={m.parentEvent?.id ? parentById.get(m.parentEvent.id) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

function plazasLabel(m: UiMatch) {
  if (typeof m.capacity === "number") return `${m.participantCount ?? 0}/${m.capacity} plazas`;
  if (typeof m.maxPlayers === "number") return `${m.participantCount ?? 0}/${m.maxPlayers} jugadores`;
  if (typeof m.participantCount === "number") return `${m.participantCount} apuntados`;
  return null;
}

function EventGroup({ event, children }: { event: UiMatch; children: UiMatch[] }) {
  const when = formatWhen(event.scheduledAt);
  const plazas = plazasLabel(event);

  return (
    <article className="rounded-3xl border-2 border-ink shadow-tactile bg-primary-soft/30 overflow-hidden">
      {/* Event header — large, coral top band */}
      <div className="relative bg-gradient-coral text-cream px-6 py-5 border-b-2 border-ink">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-cream text-ink px-3 py-1 text-xs font-bold uppercase tracking-wide border-2 border-ink">
              <CalendarDays className="h-3.5 w-3.5" />
              Evento
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight">
              {event.title || "Sin título"}
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream/90">
              {when && <li className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{when}</li>}
              {event.location && <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</li>}
              {plazas && <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{plazas}</li>}
            </ul>
          </div>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm bg-ink text-cream px-3 py-1.5 rounded-full font-semibold border-2 border-ink hover:bg-ink/80"
            >
              Ver <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Children (nested, indented visually) */}
      <div className="p-5">
        {children.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin partidas ni torneos programados dentro del evento.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-wider font-bold text-ink/60">
              <Layers className="h-3.5 w-3.5" />
              Dentro del evento · {children.length}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {children.map((c) => (
                <ActivityCard key={c.id} match={c} nested />
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function ActivityCard({ match, nested = false }: { match: UiMatch; nested?: boolean }) {
  const kind = classify(match.type);
  const when = formatWhen(match.scheduledAt);
  const plazas = plazasLabel(match);

  // Distinct visual language per type
  const style =
    kind === "torneo"
      ? {
          container: "bg-ink text-cream border-ink",
          borderTop: "before:bg-amber-400",
          badge: "bg-amber-400 text-ink",
          icon: <Trophy className="h-3.5 w-3.5" />,
          label: "Torneo",
          title: "text-cream",
          meta: "text-cream/75",
          link: "text-amber-300 hover:text-amber-200",
        }
      : kind === "partida"
        ? {
            container: "bg-card text-ink border-ink",
            borderTop: "before:bg-coral-deep",
            badge: "bg-coral-deep text-cream",
            icon: <Dice5 className="h-3.5 w-3.5" />,
            label: "Partida",
            title: "text-ink",
            meta: "text-muted-foreground",
            link: "text-coral-deep hover:underline",
          }
        : {
            container: "bg-primary-soft/40 text-ink border-ink",
            borderTop: "before:bg-ink",
            badge: "bg-ink text-cream",
            icon: <CalendarDays className="h-3.5 w-3.5" />,
            label: "Evento",
            title: "text-ink",
            meta: "text-muted-foreground",
            link: "text-coral-deep hover:underline",
          };

  return (
    <article
      className={`relative rounded-2xl border-2 ${style.container} p-4 ${nested ? "shadow-tactile-sm" : "shadow-tactile-sm"} flex flex-col gap-2 overflow-hidden
        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 ${style.borderTop}`}
    >
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style.badge}`}>
          {style.icon}
          {style.label}
        </span>
        {!nested && match.parentEvent && (
          <span className={`inline-flex items-center gap-1 text-[11px] ${style.meta}`}>
            <Layers className="h-3 w-3" />
            {match.parentEvent.title ?? "en evento"}
          </span>
        )}
      </div>
      <h3 className={`font-display text-base font-bold leading-tight ${style.title}`}>
        {match.title || "Sin título"}
      </h3>
      <ul className={`text-sm space-y-1 ${style.meta}`}>
        {when && <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" />{when}</li>}
        {match.location && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{match.location}</li>}
        {plazas && <li className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{plazas}</li>}
      </ul>
      {match.url && (
        <a
          href={match.url}
          target="_blank"
          rel="noreferrer"
          className={`text-sm inline-flex items-center gap-1 font-semibold mt-auto pt-1 ${style.link}`}
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
