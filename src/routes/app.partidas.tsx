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
import { CalendarDays, MapPin, Plus, Users, ExternalLink, RefreshCw, Search, Layers, Trophy, Dice5, ChevronDown } from "lucide-react";
import { useAppLocale } from "@/i18n/app-i18n";
import { communityDict } from "@/i18n/app/community";

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
  const { locale } = useAppLocale();
  const t = communityDict[locale].partidas;
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
      setWarning(r.endpointOk ? null : r.lastError ?? t.syncUnavailable);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : t.loadError);
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
  // Build parent event lookup + children-by-event for the dropdown
  const parentById = useMemo(() => {
    const m = new Map<string, UiMatch>();
    for (const it of sorted) if (classify(it.type) === "evento") m.set(it.id, it);
    return m;
  }, [sorted]);
  const childrenByEvent = useMemo(() => {
    const m = new Map<string, UiMatch[]>();
    for (const it of sorted) {
      const pid = it.parentEvent?.id;
      if (!pid) continue;
      // Only nest under a parent that is itself an evento present in the list.
      if (!parentById.has(pid)) continue;
      const arr = m.get(pid) ?? [];
      arr.push(it);
      m.set(pid, arr);
    }
    return m;
  }, [sorted, parentById]);

  const visible = useMemo(() => {
    if (filter === "todos") return sorted;
    return sorted.filter((m) => classify(m.type) === filter);
  }, [sorted, filter]);

  const isEmpty = visible.length === 0;

  const filterOptions: { key: typeof filter; label: string }[] = [
    { key: "todos", label: t.filters.all },
    { key: "evento", label: t.filters.events },
    { key: "torneo", label: t.filters.tournaments },
    { key: "partida", label: t.filters.matches },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {t.refresh}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> {t.createMatch}
              </Button>
            </DialogTrigger>
            <CreateMatchDialog
              eventOptions={sorted
                .filter((m) => classify(m.type) === "evento" || classify(m.type) === "torneo")
                .map((m) => ({ id: m.id, title: m.title ?? t.filters.events }))}
              onSubmit={async (payload) => {
                const res = await createFn({ data: payload });
                toast.success(t.matchCreated);
                if (res.karma?.claimed) {
                  toast.success(t.karmaClaimed(res.karma.points));
                } else if (res.karma?.reason) {
                  toast.message(t.karmaNotClaimed(res.karma.reason));
                }
                setDialogOpen(false);
                void load();
              }}
            />

          </Dialog>
        </div>
      </header>

      {warning && (
        <div className="bg-cream border-2 border-ink/20 rounded-2xl p-4 text-sm text-muted-foreground">
          <strong>{t.warningPrefix}</strong> {warning}
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
        <p className="text-muted-foreground">{t.loading}</p>
      ) : isEmpty ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 shadow-tactile-sm text-center">
          <p className="text-muted-foreground text-sm">
            {counts.todos === 0
              ? t.emptyNoActivity
              : t.emptyFilter}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {visible.map((m) => (
            <ActivityCard
              key={m.id}
              match={m}
              parent={m.parentEvent?.id ? parentById.get(m.parentEvent.id) ?? null : null}
              childItems={classify(m.type) === "evento" ? childrenByEvent.get(m.id) ?? [] : []}
              t={t}
              dateLocale={communityDict[locale].dateLocale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatWhen(iso: string | null | undefined, dateLocale: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(dateLocale, { dateStyle: "medium", timeStyle: "short" });
}

function plazasLabel(m: UiMatch, t: (typeof communityDict)["es"]["partidas"]) {
  if (typeof m.capacity === "number") return t.seats(m.participantCount ?? 0, m.capacity);
  if (typeof m.maxPlayers === "number") return t.players(m.participantCount ?? 0, m.maxPlayers);
  if (typeof m.participantCount === "number") return t.signedUp(m.participantCount);
  return null;
}

function ActivityCard({
  match,
  parent,
  childItems = [],
  t,
  dateLocale,
}: {
  match: UiMatch;
  parent?: UiMatch | null;
  childItems?: UiMatch[];
  t: (typeof communityDict)["es"]["partidas"];
  dateLocale: string;
}) {
  const kind = classify(match.type);
  const when = formatWhen(match.scheduledAt, dateLocale);
  const plazas = plazasLabel(match, t);

  const style =
    kind === "torneo"
      ? {
          container: "bg-ink text-cream border-ink",
          borderTop: "before:bg-amber-400",
          badge: "bg-amber-400 text-ink",
          icon: <Trophy className="h-3 w-3" />,
          label: t.typeLabels.torneo,
          title: "text-cream",
          meta: "text-cream/75",
          link: "text-amber-300 hover:text-amber-200",
        }
      : kind === "partida"
        ? {
            container: "bg-card text-ink border-ink",
            borderTop: "before:bg-coral-deep",
            badge: "bg-coral-deep text-cream",
            icon: <Dice5 className="h-3 w-3" />,
            label: t.typeLabels.partida,
            title: "text-ink",
            meta: "text-muted-foreground",
            link: "text-coral-deep hover:underline",
          }
        : {
            container: "bg-primary-soft/40 text-ink border-ink",
            borderTop: "before:bg-coral-deep",
            badge: "bg-ink text-cream",
            icon: <CalendarDays className="h-3 w-3" />,
            label: t.typeLabels.evento,
            title: "text-ink",
            meta: "text-muted-foreground",
            link: "text-coral-deep hover:underline",
          };

  const parentLabel = parent?.title ?? match.parentEvent?.title ?? null;

  return (
    <article
      className={`relative rounded-xl border-2 ${style.container} p-3 shadow-tactile-sm flex flex-col gap-1.5 overflow-hidden
        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 ${style.borderTop}`}
    >
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
          {style.icon}
          {style.label}
        </span>
        {parentLabel && kind !== "evento" && (
          <span className={`inline-flex items-center gap-1 text-[10px] truncate max-w-[55%] ${style.meta}`}>
            <Layers className="h-3 w-3 shrink-0" />
            <span className="truncate">{parentLabel}</span>
          </span>
        )}
      </div>
      <h3 className={`font-display text-sm font-bold leading-snug ${style.title}`}>
        {match.title || t.untitled}
      </h3>
      <ul className={`text-xs space-y-0.5 ${style.meta}`}>
        {when && <li className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{when}</li>}
        {match.location && <li className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{match.location}</span></li>}
        {plazas && <li className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 shrink-0" />{plazas}</li>}
      </ul>
      {match.url && (
        <a
          href={match.url}
          target="_blank"
          rel="noreferrer"
          className={`text-xs inline-flex items-center gap-1 font-semibold pt-1 ${style.link}`}
        >
          {t.viewInLudoya} <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {childItems.length > 0 && (
        <details className="mt-auto pt-2 border-t border-ink/10 group">
          <summary className={`cursor-pointer list-none flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide ${style.meta}`}>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              {childItems.length} {childItems.length === 1 ? t.activity : t.activities}
            </span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {childItems.map((c) => {
              const ck = classify(c.type);
              const dot = ck === "torneo" ? "bg-amber-400" : ck === "evento" ? "bg-ink" : "bg-coral-deep";
              const kLabel = ck === "torneo" ? t.typeLabels.torneo : ck === "evento" ? t.typeLabels.evento : t.typeLabels.partida;
              return (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${style.title}`}>{c.title || t.untitled}</div>
                    <div className={`text-[11px] ${style.meta}`}>
                      {kLabel}
                      {c.scheduledAt && ` · ${formatWhen(c.scheduledAt, dateLocale)}`}
                    </div>
                  </div>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`shrink-0 ${style.link}`}
                      aria-label={t.viewInLudoya}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
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
  eventOptions = [],
}: {
  eventOptions?: { id: string; title: string }[];
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
    parentEventId?: string | null;
    claimKarma?: boolean;
  }) => Promise<void>;
}) {
  const searchFn = useServerFn(searchLudoyaBoardgamesFn);

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [minPlayers, setMinPlayers] = useState<string>("");
  const [maxPlayers, setMaxPlayers] = useState<string>("");
  const [parentEventId, setParentEventId] = useState<string>("");
  const [claimKarma, setClaimKarma] = useState(true);

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
        parentEventId: parentEventId || null,
        claimKarma,
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

        <div className="space-y-2">
          <Label>¿Dentro de un evento? (opcional)</Label>
          <select
            value={parentEventId}
            onChange={(e) => setParentEventId(e.target.value)}
            className="w-full h-10 rounded-lg border-2 border-ink bg-background px-3 text-sm"
          >
            <option value="">Publicar en el muro de la comunidad</option>
            {eventOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={claimKarma}
            onChange={(e) => setClaimKarma(e.target.checked)}
            className="accent-coral"
          />
          Reclamar karma por crear esta partida
        </label>


        <DialogFooter>
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Creando…" : "Crear partida"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
