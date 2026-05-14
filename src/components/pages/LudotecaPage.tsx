import { useEffect, useMemo, useState } from "react";
import { Search, Users, Clock, Brain, Star, ExternalLink, RefreshCw, Filter, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { listLudoteca } from "@/server/ludoteca.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableText } from "@/editor/Editable";
import { useSectionContent } from "@/cms/useSectionContent";
import { or } from "@/cms/or";

import { LocationBadge, LocationLegend } from "@/components/ludoteca/LocationBadge";
import { RecommendationsSection } from "@/components/ludoteca/RecommendationsSection";

interface BggGame {
  id: string;
  bgg_id: number | null;
  title: string;
  image_url: string | null;
  thumbnail_url: string | null;
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  duration_minutes: number | null;
  min_age: number | null;
  bgg_rating: number | null;
  bgg_rating_users: number | null;
  bgg_weight: number | null;
  bgg_weight_users: number | null;
  bgg_rank: number | null;
  bgg_type: string | null;
  categories: string[];
  mechanics: string[];
  bgg_url: string | null;
  total_copies: number | null;
  shelf: "1" | "2" | "3" | "4" | "on_demand" | "drawer" | null;
  shape: "triangle" | "heart" | "square" | null;
  slot_number: number | null;
  drawer_number: number | null;
  drawer_letter: "a" | "b" | "c" | "d" | null;
}

const T = {
  es: {
    eyebrow: "Ludoteca KLEFF",
    title: "Nuestra colección de juegos",
    intro:
      "Más de cien juegos de mesa sincronizados directamente con BoardGameGeek. Filtra por jugadores, duración, dificultad o tipo y descubre tu próxima partida.",
    search: "Buscar por título, mecánica o categoría…",
    filters: "Filtros",
    clear: "Limpiar",
    results: (n: number) => `${n} juego${n === 1 ? "" : "s"}`,
    players: "Jugadores",
    duration: "Duración",
    weight: "Dificultad",
    type: "Tipo",
    mechanic: "Mecánica",
    sort: "Ordenar",
    sortAlpha: "A → Z",
    sortAlphaDesc: "Z → A",
    sortRating: "Mejor valorados",
    sortWeightAsc: "Menos complejos",
    sortWeightDesc: "Más complejos",
    any: "Cualquiera",
    minutes: "min",
    rating: "Valoración",
    weightLabel: (w: number) =>
      w < 2 ? "Muy ligero" : w < 2.7 ? "Ligero" : w < 3.4 ? "Medio" : w < 4.1 ? "Pesado" : "Muy pesado",
    empty: "No hay juegos que coincidan con los filtros.",
    loading: "Cargando colección…",
    viewOnBgg: "Ver en BGG",
    syncedAt: (d: string) => `Actualizado ${d}`,
    notSynced: "Aún sin sincronizar. Pulsa el botón en el admin para importar la colección.",
    age: "+",
  },
  en: {
    eyebrow: "KLEFF Library",
    title: "Our board game collection",
    intro:
      "Over a hundred board games synced directly from BoardGameGeek. Filter by players, length, weight or type and find your next game.",
    search: "Search by title, mechanic or category…",
    filters: "Filters",
    clear: "Clear",
    results: (n: number) => `${n} game${n === 1 ? "" : "s"}`,
    players: "Players",
    duration: "Length",
    weight: "Weight",
    type: "Type",
    mechanic: "Mechanic",
    sort: "Sort",
    sortAlpha: "A → Z",
    sortAlphaDesc: "Z → A",
    sortRating: "Top rated",
    sortWeightAsc: "Lightest first",
    sortWeightDesc: "Heaviest first",
    any: "Any",
    minutes: "min",
    rating: "Rating",
    weightLabel: (w: number) =>
      w < 2 ? "Very light" : w < 2.7 ? "Light" : w < 3.4 ? "Medium" : w < 4.1 ? "Heavy" : "Very heavy",
    empty: "No games match the current filters.",
    loading: "Loading collection…",
    viewOnBgg: "View on BGG",
    syncedAt: (d: string) => `Updated ${d}`,
    notSynced: "Not synced yet. Trigger the sync from the admin panel to import the collection.",
    age: "+",
  },
  ca: {
    eyebrow: "Ludoteca KLEFF",
    title: "La nostra col·lecció de jocs",
    intro:
      "Més de cent jocs de taula sincronitzats directament amb BoardGameGeek. Filtra per jugadors, durada, dificultat o tipus i troba la teva propera partida.",
    search: "Cerca per títol, mecànica o categoria…",
    filters: "Filtres",
    clear: "Neteja",
    results: (n: number) => `${n} joc${n === 1 ? "" : "s"}`,
    players: "Jugadors",
    duration: "Durada",
    weight: "Dificultat",
    type: "Tipus",
    mechanic: "Mecànica",
    sort: "Ordena",
    sortAlpha: "A → Z",
    sortAlphaDesc: "Z → A",
    sortRating: "Millor valorats",
    sortWeightAsc: "Menys complexos",
    sortWeightDesc: "Més complexos",
    any: "Qualsevol",
    minutes: "min",
    rating: "Valoració",
    weightLabel: (w: number) =>
      w < 2 ? "Molt lleuger" : w < 2.7 ? "Lleuger" : w < 3.4 ? "Mitjà" : w < 4.1 ? "Pesat" : "Molt pesat",
    empty: "Cap joc coincideix amb els filtres.",
    loading: "Carregant col·lecció…",
    viewOnBgg: "Veure a BGG",
    syncedAt: (d: string) => `Actualitzat ${d}`,
    notSynced: "Encara no sincronitzat. Activa la sincronització des de l'admin.",
    age: "+",
  },
} as const;

function weightColor(w: number | null): string {
  if (w == null) return "bg-cream-deep border-ink/40 text-ink";
  if (w < 2) return "bg-emerald-500/90 text-cream border-ink";
  if (w < 2.7) return "bg-lime-500/90 text-ink border-ink";
  if (w < 3.4) return "bg-amber-500/90 text-ink border-ink";
  if (w < 4.1) return "bg-orange-500/90 text-cream border-ink";
  return "bg-red-600/90 text-cream border-ink";
}

function formatPlayers(min: number | null, max: number | null): string {
  if (!min && !max) return "—";
  if (min && max && min !== max) return `${min}–${max}`;
  return String(min ?? max);
}

function formatDuration(min: number | null, max: number | null, fallback: number | null): string {
  if (min && max && min !== max) return `${min}–${max}`;
  return String(max ?? min ?? fallback ?? "—");
}

const PLAYER_BUCKETS = [
  { key: "1", label: "1", test: (g: BggGame) => (g.min_players ?? 99) <= 1 && (g.max_players ?? 0) >= 1 },
  { key: "2", label: "2", test: (g: BggGame) => (g.min_players ?? 99) <= 2 && (g.max_players ?? 0) >= 2 },
  { key: "3-4", label: "3–4", test: (g: BggGame) => (g.min_players ?? 99) <= 4 && (g.max_players ?? 0) >= 3 },
  { key: "5-6", label: "5–6", test: (g: BggGame) => (g.min_players ?? 99) <= 6 && (g.max_players ?? 0) >= 5 },
  { key: "7+", label: "7+", test: (g: BggGame) => (g.max_players ?? 0) >= 7 },
];

const DURATION_BUCKETS = [
  { key: "<30", label: "<30", test: (m: number) => m > 0 && m < 30 },
  { key: "30-60", label: "30–60", test: (m: number) => m >= 30 && m <= 60 },
  { key: "60-90", label: "60–90", test: (m: number) => m > 60 && m <= 90 },
  { key: "90-120", label: "90–120", test: (m: number) => m > 90 && m <= 120 },
  { key: "120+", label: "120+", test: (m: number) => m > 120 },
];

const WEIGHT_BUCKETS = [
  { key: "1-2", label: "1–2", test: (w: number) => w >= 1 && w < 2 },
  { key: "2-3", label: "2–3", test: (w: number) => w >= 2 && w < 3 },
  { key: "3-4", label: "3–4", test: (w: number) => w >= 3 && w < 4 },
  { key: "4-5", label: "4–5", test: (w: number) => w >= 4 && w <= 5 },
];

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border-2 transition-all ${
        active
          ? "bg-coral text-cream border-ink shadow-tactile-sm"
          : "bg-card text-ink border-ink/30 hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function LudotecaPage() {
  const { locale } = useI18n();
  const t = T[locale];
  const hero = useSectionContent("ludoteca.hero");

  const [games, setGames] = useState<BggGame[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [mechanic, setMechanic] = useState<string | null>(null);
  const [sort, setSort] = useState<"alpha" | "alpha-desc" | "rating" | "weight-asc" | "weight-desc">("alpha");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listLudoteca()
      .then((res) => {
        if (cancelled) return;
        setGames((res.games ?? []) as BggGame[]);
        setSyncedAt(res.syncedAt);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[ludoteca] load failed", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setGames([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const g of games) if (g.bgg_type) set.add(g.bgg_type);
    return Array.from(set).sort();
  }, [games]);

  const mechanics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of games) for (const m of g.mechanics ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([m]) => m);
  }, [games]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = games.filter((g) => {
      if (q) {
        const hay = `${g.title} ${(g.mechanics ?? []).join(" ")} ${(g.categories ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (players) {
        const bucket = PLAYER_BUCKETS.find((b) => b.key === players);
        if (bucket && !bucket.test(g)) return false;
      }
      if (duration) {
        const bucket = DURATION_BUCKETS.find((b) => b.key === duration);
        const m = g.duration_minutes ?? g.max_playtime ?? g.min_playtime ?? 0;
        if (bucket && !bucket.test(m)) return false;
      }
      if (weight) {
        const bucket = WEIGHT_BUCKETS.find((b) => b.key === weight);
        if (bucket && (g.bgg_weight == null || !bucket.test(g.bgg_weight))) return false;
      }
      if (type && g.bgg_type !== type) return false;
      if (mechanic && !(g.mechanics ?? []).includes(mechanic)) return false;
      return true;
    });
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    const sorted = [...list];
    switch (sort) {
      case "alpha":
        sorted.sort((a, b) => collator.compare(a.title, b.title));
        break;
      case "alpha-desc":
        sorted.sort((a, b) => collator.compare(b.title, a.title));
        break;
      case "rating":
        sorted.sort((a, b) => (b.bgg_rating ?? -1) - (a.bgg_rating ?? -1));
        break;
      case "weight-asc":
        sorted.sort((a, b) => (a.bgg_weight ?? 99) - (b.bgg_weight ?? 99));
        break;
      case "weight-desc":
        sorted.sort((a, b) => (b.bgg_weight ?? -1) - (a.bgg_weight ?? -1));
        break;
    }
    return sorted;
  }, [games, search, players, duration, weight, type, mechanic, sort, locale]);

  const clearFilters = () => {
    setSearch("");
    setPlayers(null);
    setDuration(null);
    setWeight(null);
    setType(null);
    setMechanic(null);
  };

  const hasActiveFilters = search || players || duration || weight || type || mechanic;

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-cream border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
            <Star className="h-3.5 w-3.5" />
            <EditableText id="ludoteca.hero.eyebrow" as="span">{or(hero.eyebrow, t.eyebrow)}</EditableText>
          </span>
          <EditableText id="ludoteca.hero.title" as="h1" className="mt-5 text-4xl sm:text-5xl md:text-6xl font-display font-semibold leading-[1.02] tracking-tight">
            {or(hero.title, t.title)}
          </EditableText>
          <EditableText id="ludoteca.hero.intro" as="p" className="mt-5 text-lg text-foreground/75 max-w-3xl leading-relaxed">{or(hero.intro, t.intro)}</EditableText>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="pl-11 h-12 bg-card border-2 border-ink rounded-2xl text-base shadow-tactile-sm focus-visible:ring-coral"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="border-2 border-ink rounded-2xl h-12 font-bold"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t.filters}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="rounded-2xl h-12 font-bold text-coral-deep hover:bg-coral/10"
              >
                <X className="h-4 w-4 mr-1" /> {t.clear}
              </Button>
            )}
          </div>

          <div className="mt-3 text-xs text-foreground/50 flex items-center gap-3">
            <span className="font-bold uppercase tracking-widest">{t.results(filtered.length)}</span>
            {syncedAt && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                {t.syncedAt(new Date(syncedAt).toLocaleDateString(locale))}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* FILTERS */}
      {showFilters && (
        <section className="bg-cream-deep/40 border-b-2 border-ink/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">{t.sort}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  ["alpha", t.sortAlpha],
                  ["alpha-desc", t.sortAlphaDesc],
                  ["rating", t.sortRating],
                  ["weight-asc", t.sortWeightAsc],
                  ["weight-desc", t.sortWeightDesc],
                ] as const).map(([key, label]) => (
                  <FilterChip key={key} active={sort === key} onClick={() => setSort(key)}>
                    {label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">{t.players}</p>
              <div className="flex flex-wrap gap-2">
                {PLAYER_BUCKETS.map((b) => (
                  <FilterChip key={b.key} active={players === b.key} onClick={() => setPlayers(players === b.key ? null : b.key)}>
                    {b.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">
                {t.duration} ({t.minutes})
              </p>
              <div className="flex flex-wrap gap-2">
                {DURATION_BUCKETS.map((b) => (
                  <FilterChip key={b.key} active={duration === b.key} onClick={() => setDuration(duration === b.key ? null : b.key)}>
                    {b.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">{t.weight} (BGG)</p>
              <div className="flex flex-wrap gap-2">
                {WEIGHT_BUCKETS.map((b) => (
                  <FilterChip key={b.key} active={weight === b.key} onClick={() => setWeight(weight === b.key ? null : b.key)}>
                    {b.label}
                  </FilterChip>
                ))}
              </div>
            </div>
            {types.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">{t.type}</p>
                <div className="flex flex-wrap gap-2">
                  {types.map((tp) => (
                    <FilterChip key={tp} active={type === tp} onClick={() => setType(type === tp ? null : tp)}>
                      {tp}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}
            {mechanics.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-2">{t.mechanic}</p>
                <div className="flex flex-wrap gap-2">
                  {mechanics.map((m) => (
                    <FilterChip key={m} active={mechanic === m} onClick={() => setMechanic(mechanic === m ? null : m)}>
                      {m}
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="bg-cream py-12 min-h-[40vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-foreground/50">{t.loading}</p>
          ) : error ? (
            <div className="bg-card border-2 border-red-500/40 rounded-3xl p-6 text-center text-red-700">
              <p className="font-bold mb-1">Error</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-card border-2 border-dashed border-ink/30 rounded-3xl p-10 text-center text-foreground/60">
              {t.notSynced}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-foreground/50 text-center py-12">{t.empty}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filtered.map((g) => (
                <article
                  key={g.id}
                  className="group bg-card border-2 border-ink rounded-2xl overflow-hidden shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all flex flex-col"
                >
                  <div className="relative aspect-square bg-cream-deep overflow-hidden border-b-2 border-ink">
                    {g.image_url || g.thumbnail_url ? (
                      <img
                        src={g.image_url ?? g.thumbnail_url ?? ""}
                        alt={g.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎲</div>
                    )}
                    {g.bgg_weight != null && (
                      <span
                        title={t.weightLabel(g.bgg_weight)}
                        className={`absolute top-2 right-2 text-[10px] font-bold border-2 rounded-full px-2 py-0.5 ${weightColor(g.bgg_weight)}`}
                      >
                        {g.bgg_weight.toFixed(1)}
                      </span>
                    )}
                    {g.bgg_rating != null && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-ink/85 text-cream text-[10px] font-bold rounded-full px-2 py-0.5 border border-cream/20">
                        <Star className="h-2.5 w-2.5 fill-coral text-coral" />
                        {g.bgg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <h3 className="font-display font-semibold leading-tight text-sm line-clamp-2" title={g.title}>
                      {g.title}
                      {g.year_published ? <span className="text-foreground/40 font-normal ml-1">({g.year_published})</span> : null}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-foreground/70">
                      <span className="inline-flex items-center gap-1 bg-cream-deep border border-ink/20 rounded-full px-1.5 py-0.5">
                        <Users className="h-2.5 w-2.5" />
                        {formatPlayers(g.min_players, g.max_players)}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-cream-deep border border-ink/20 rounded-full px-1.5 py-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDuration(g.min_playtime, g.max_playtime, g.duration_minutes)}′
                      </span>
                      {g.min_age ? (
                        <span className="inline-flex items-center gap-1 bg-cream-deep border border-ink/20 rounded-full px-1.5 py-0.5">
                          {g.min_age}
                          {t.age}
                        </span>
                      ) : null}
                      {g.bgg_type ? (
                        <span className="inline-flex items-center gap-1 bg-coral/15 text-coral-deep border border-coral/40 rounded-full px-1.5 py-0.5 font-bold">
                          {g.bgg_type}
                        </span>
                      ) : null}
                    </div>
                    {g.mechanics && g.mechanics.length > 0 && (
                      <p className="text-[10px] text-foreground/50 line-clamp-2 leading-snug">
                        <Brain className="h-2.5 w-2.5 inline mr-1" />
                        {g.mechanics.slice(0, 4).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                      <LocationBadge loc={g} />
                      {g.bgg_url && (
                        <a
                          href={g.bgg_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold uppercase tracking-wider text-coral-deep hover:text-coral inline-flex items-center gap-1"
                        >
                          BGG <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="mt-10 space-y-8">
            <RecommendationsSection games={games} />
            <LocationLegend />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
