import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { recommendSimilar } from "@/lib/ludoteca.functions";
import { Sparkles, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Game {
  id: string;
  title: string;
  image_url: string | null;
  thumbnail_url: string | null;
  bgg_weight: number | null;
  bgg_rating: number | null;
  mechanics: string[] | null;
  categories: string[] | null;
  year_published: number | null;
}

interface Recommendation {
  game: Game;
  score: number;
  shared: string[];
}

export function RecommendationsSection({ games }: { games: Game[] }) {
  const recommend = useServerFn(recommendSimilar);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Game | null>(null);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selected) return [] as Game[];
    return games.filter((g) => g.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query, games, selected]);

  const pick = async (g: Game) => {
    setSelected(g);
    setQuery(g.title);
    setLoading(true);
    try {
      const res = await recommend({ data: { gameId: g.id, limit: 6 } });
      setResults(res.results as Recommendation[]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelected(null);
    setQuery("");
    setResults([]);
  };

  return (
    <section className="rounded-3xl border-2 border-ink bg-cream-deep/40 p-6 md:p-8 shadow-tactile-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-coral-deep" />
        <h2 className="font-display text-2xl font-bold">¿Te gustó un juego? Te proponemos similares</h2>
      </div>
      <p className="text-sm text-foreground/65 mb-5">
        Escribe el nombre de un juego de la ludoteca y te sugerimos seis parecidos por mecánicas, categorías y dificultad.
      </p>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) setSelected(null);
          }}
          placeholder="Por ejemplo: Catan, Wingspan…"
          className="pl-10 h-11 bg-card border-2 border-ink rounded-2xl"
        />
        {selected && (
          <button
            type="button"
            onClick={reset}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-ink/5"
            aria-label="Limpiar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {matches.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-card border-2 border-ink rounded-2xl shadow-tactile overflow-hidden">
            {matches.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => pick(g)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-cream-deep text-left"
              >
                {g.thumbnail_url || g.image_url ? (
                  <img src={g.thumbnail_url ?? g.image_url ?? ""} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-primary-soft" />
                )}
                <span className="text-sm font-semibold">{g.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <p className="mt-6 text-foreground/60">Buscando juegos similares…</p>}

      {selected && !loading && results.length === 0 && (
        <p className="mt-6 text-foreground/60">No encontramos juegos suficientemente parecidos.</p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {results.map(({ game, shared }) => (
            <article
              key={game.id}
              className="bg-card border-2 border-ink rounded-2xl overflow-hidden shadow-tactile-sm flex flex-col"
            >
              <div className="aspect-square bg-cream-deep">
                {game.image_url || game.thumbnail_url ? (
                  <img
                    src={game.image_url ?? game.thumbnail_url ?? ""}
                    alt={game.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎲</div>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2" title={game.title}>
                  {game.title}
                </h3>
                {shared.length > 0 && (
                  <p className="text-[10px] text-foreground/55 line-clamp-2">
                    Comparte: {shared.join(" · ")}
                  </p>
                )}
              </div>
            </article>
          ))}
          <div className="col-span-full">
            <Button variant="ghost" size="sm" onClick={reset}>
              Probar con otro juego
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
