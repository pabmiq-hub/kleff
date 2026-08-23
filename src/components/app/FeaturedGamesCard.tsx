import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles, Users, Clock, ExternalLink } from "lucide-react";
import { listCurrentFeaturedGames } from "@/lib/featured.functions";
import { useAppLocale } from "@/i18n/app-i18n";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

interface FeaturedGame {
  id: string;
  start_date: string;
  end_date: string;
  bgg_games: {
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
    bgg_weight: number | null;
    categories: string[] | null;
    bgg_url: string | null;
  } | null;
}

const DATE_LOCALES: Record<string, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

function formatDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  return new Date(y, m - 1, d).toLocaleDateString(DATE_LOCALES[locale] ?? "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STRINGS = {
  es: { featuredGame: "Juego destacado", featuredGames: "Juegos destacados", from: "del", to: "al", rent: "Alquilar" },
  ca: { featuredGame: "Joc destacat", featuredGames: "Jocs destacats", from: "del", to: "al", rent: "Lloga" },
  en: { featuredGame: "Featured game", featuredGames: "Featured games", from: "from", to: "to", rent: "Rent" },
} as const;

function playersLabel(g: FeaturedGame["bgg_games"]): string | null {
  if (!g) return null;
  const min = g.min_players;
  const max = g.max_players;
  if (min && max) return min === max ? `${min}` : `${min}–${max}`;
  return min?.toString() ?? max?.toString() ?? null;
}

function durationLabel(g: FeaturedGame["bgg_games"]): string | null {
  if (!g) return null;
  const min = g.min_playtime;
  const max = g.max_playtime ?? g.duration_minutes;
  if (min && max && min !== max) return `${min}–${max}′`;
  const d = g.duration_minutes ?? min ?? max;
  return d ? `${d}′` : null;
}

export function FeaturedGamesCard() {
  const { locale } = useAppLocale();
  const t = STRINGS[locale] ?? STRINGS.es;
  const listFn = useServerFn(listCurrentFeaturedGames);
  const [items, setItems] = useState<FeaturedGame[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listFn({ data: undefined as never });
        setItems((r as unknown as { featured: FeaturedGame[] }).featured ?? []);
      } finally {
        setLoaded(true);
      }
    })();
  }, [listFn]);

  if (!loaded || items.length === 0) return null;

  // Group by identical date range for the section header
  const first = items[0];
  const allSame = items.every(
    (i) => i.start_date === first.start_date && i.end_date === first.end_date,
  );

  return (
    <section className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm">
      <header className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-coral-deep" />
        <div>
          <h2 className="font-display font-bold text-lg">
            {items.length === 1 ? t.featuredGame : t.featuredGames}
          </h2>
          {allSame && (
            <p className="text-xs text-muted-foreground">
              {t.from} {formatDate(first.start_date, locale)} {t.to} {formatDate(first.end_date, locale)}
            </p>
          )}
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((f) => {
          const g = f.bgg_games;
          if (!g) return null;
          const players = playersLabel(g);
          const duration = durationLabel(g);
          return (
            <article
              key={f.id}
              className="relative bg-cream border-2 border-ink rounded-xl overflow-hidden shadow-tactile-sm"
            >
              {(g.image_url || g.thumbnail_url) && (
                <div className="aspect-[4/3] bg-ink/5 relative">
                  <img
                    src={getOptimizedImageUrl(g.thumbnail_url ?? g.image_url ?? "", { width: 400, height: 300 })}
                    alt={g.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {g.bgg_rating && (
                    <span className="absolute top-2 right-2 bg-ink text-cream text-xs font-bold rounded-full px-2 py-1 flex items-center gap-1">
                      ★ {g.bgg_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold leading-tight">
                  {g.title}
                  {g.year_published && (
                    <span className="text-ink/50 font-normal ml-1">({g.year_published})</span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs text-ink/70">
                  {players && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {players}
                    </span>
                  )}
                  {duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {duration}
                    </span>
                  )}
                  {g.min_age && <span className="inline-flex items-center gap-1">{g.min_age}+</span>}
                </div>
                {!allSame && (
                  <p className="text-[11px] text-ink/50">
                    {formatDate(f.start_date, locale)} → {formatDate(f.end_date, locale)}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <Link
                    to="/app/rentals"
                    className="text-xs font-semibold text-coral-deep hover:underline"
                  >
                    {t.rent}
                  </Link>
                  {g.bgg_url && (
                    <a
                      href={g.bgg_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink/60 hover:text-ink inline-flex items-center gap-1"
                    >
                      BGG <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
