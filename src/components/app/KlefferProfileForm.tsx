import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyKlefferProfile, updateMyKlefferProfile } from "@/lib/kleffer-profile.functions";
import { searchLudoyaBoardgamesFn } from "@/lib/ludoya.functions";
import {
  ATTENDS_ALONE,
  AVAILABILITY,
  EMPTY_KLEFFER_PROFILE,
  EXPERIENCE,
  GAME_TYPES,
  GOALS,
  LANGUAGES,
  SCHEDULED_GAMES,
  TEACHES,
  klefferProfileCompletion,
  type FavoriteGame,
  type KlefferProfileData,
  localizeOptions,
} from "@/lib/kleffer-profile-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search, X, Loader2 } from "lucide-react";
import { useAppLocale } from "@/i18n/app-i18n";
import { accountDict } from "@/i18n/app/account";

function Chips({
  options,
  values,
  onChange,
  single = false,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  values: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              if (single) onChange(active ? [] : [o.value]);
              else onChange(active ? values.filter((v) => v !== o.value) : [...values, o.value]);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-ink bg-coral text-ink font-semibold"
                : "border-ink/20 bg-card text-ink/70 hover:border-coral"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function KlefferProfileForm() {
  const load = useServerFn(getMyKlefferProfile);
  const save = useServerFn(updateMyKlefferProfile);
  const searchFn = useServerFn(searchLudoyaBoardgamesFn);

  const { locale } = useAppLocale();
  const t = accountDict[locale].kleffer;
  const [state, setState] = useState<KlefferProfileData>(EMPTY_KLEFFER_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gameQuery, setGameQuery] = useState("");
  const [results, setResults] = useState<FavoriteGame[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void load({ data: undefined as never })
      .then((r) => {
        const p = r.profile as Record<string, unknown> | null;
        if (!p) return;
        setState({
          attends_alone: (p["attends_alone"] as string | null) ?? null,
          scheduled_games: (p["scheduled_games"] as string | null) ?? null,
          goals: (p["goals"] as string[]) ?? [],
          favorite_games: (p["favorite_games"] as FavoriteGame[]) ?? [],
          game_types: (p["game_types"] as string[]) ?? [],
          experience_level: (p["experience_level"] as string | null) ?? null,
          availability: (p["availability"] as string[]) ?? [],
          languages: (p["languages"] as string[]) ?? [],
          teaches: (p["teaches"] as string | null) ?? null,
          bio: (p["bio"] as string | null) ?? null,
          is_public: (p["is_public"] as boolean) ?? true,
        });
      })
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = gameQuery.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      setSearching(true);
      void searchFn({ data: { query: q } })
        .then((r) => {
          const list = (r.results ?? []) as Array<{ id: string; name: string; imageUrl?: string | null }>;
          setResults(list.slice(0, 8).map((g) => ({ id: String(g.id), name: g.name, imageUrl: g.imageUrl ?? null })));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [gameQuery, searchFn]);

  const completion = useMemo(() => klefferProfileCompletion(state), [state]);

  const addGame = (g: FavoriteGame) => {
    if (state.favorite_games.length >= 5) {
      toast.error(t.maxGamesError);
      return;
    }
    if (state.favorite_games.some((x) => x.id === g.id)) return;
    setState((s) => ({ ...s, favorite_games: [...s.favorite_games, g] }));
    setGameQuery("");
    setResults([]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        data: {
          attendsAlone: state.attends_alone,
          scheduledGames: state.scheduled_games,
          goals: state.goals,
          favoriteGames: state.favorite_games,
          gameTypes: state.game_types,
          experienceLevel: state.experience_level,
          availability: state.availability,
          languages: state.languages,
          teaches: state.teaches,
          bio: state.bio,
          isPublic: state.is_public,
        },
      });
      toast.success(t.saveSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">{t.loading}</p>;

  return (
    <form onSubmit={submit} className="space-y-6 bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">{t.title}</h2>
          <span className="text-sm text-muted-foreground">{completion}% {t.completed}</span>
        </div>
        <Progress value={completion} />
        <p className="text-sm text-muted-foreground">
          {t.intro}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t.attendsAloneLabel}</Label>
        <Chips
          options={localizeOptions("attendsAlone", ATTENDS_ALONE, locale)}
          single
          values={state.attends_alone ? [state.attends_alone] : []}
          onChange={(v) => setState((s) => ({ ...s, attends_alone: v[0] ?? null }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.scheduledGamesLabel}</Label>
        <Chips
          options={localizeOptions("scheduledGames", SCHEDULED_GAMES, locale)}
          single
          values={state.scheduled_games ? [state.scheduled_games] : []}
          onChange={(v) => setState((s) => ({ ...s, scheduled_games: v[0] ?? null }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.goalsLabel}</Label>
        <Chips options={localizeOptions("goals", GOALS, locale)} values={state.goals} onChange={(v) => setState((s) => ({ ...s, goals: v }))} />
      </div>

      <div className="space-y-2">
        <Label>{t.favoriteGamesLabel}</Label>
        {state.favorite_games.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.favorite_games.map((g) => (
              <span
                key={g.id}
                className="flex items-center gap-2 rounded-full border border-ink/20 bg-cream-deep/50 pl-1 pr-2 py-1 text-sm"
              >
                {g.imageUrl ? (
                  <img loading="lazy" decoding="async" src={g.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : null}
                {g.name}
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, favorite_games: s.favorite_games.filter((x) => x.id !== g.id) }))
                  }
                  aria-label={`${t.removeGame} ${g.name}`}
                >
                  <X className="h-3.5 w-3.5 text-ink/50 hover:text-coral-deep" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
          <Input
            value={gameQuery}
            onChange={(e) => setGameQuery(e.target.value)}
            placeholder={t.searchGamePlaceholder}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ink/40" />}
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-ink/20 bg-card shadow-lg">
              {results.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => addGame(g)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream-deep/60"
                  >
                    {g.imageUrl ? <img loading="lazy" decoding="async" src={g.imageUrl} alt="" className="h-8 w-8 rounded object-cover" /> : null}
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t.gameTypesLabel}</Label>
        <Chips
          options={localizeOptions("gameTypes", GAME_TYPES, locale)}
          values={state.game_types}
          onChange={(v) => setState((s) => ({ ...s, game_types: v }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.experienceLabel}</Label>
        <Chips
          options={localizeOptions("experience", EXPERIENCE, locale)}
          single
          values={state.experience_level ? [state.experience_level] : []}
          onChange={(v) => setState((s) => ({ ...s, experience_level: v[0] ?? null }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.availabilityLabel}</Label>
        <Chips
          options={localizeOptions("availability", AVAILABILITY, locale)}
          values={state.availability}
          onChange={(v) => setState((s) => ({ ...s, availability: v }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.languagesLabel}</Label>
        <Chips
          options={localizeOptions("languages", LANGUAGES, locale)}
          values={state.languages}
          onChange={(v) => setState((s) => ({ ...s, languages: v }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.teachesLabel}</Label>
        <Chips
          options={localizeOptions("teaches", TEACHES, locale)}
          single
          values={state.teaches ? [state.teaches] : []}
          onChange={(v) => setState((s) => ({ ...s, teaches: v[0] ?? null }))}
        />
      </div>

      <div className="space-y-2">
        <Label>{t.bioLabel}</Label>
        <Textarea
          value={state.bio ?? ""}
          maxLength={200}
          rows={3}
          placeholder={t.bioPlaceholder}
          onChange={(e) => setState((s) => ({ ...s, bio: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground text-right">{(state.bio ?? "").length}/200</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-ink/15 bg-cream-deep/40 p-3">
        <div>
          <p className="text-sm font-semibold">{t.publicTitle}</p>
          <p className="text-xs text-muted-foreground">{t.publicDesc}</p>
        </div>
        <Switch
          checked={state.is_public}
          onCheckedChange={(v) => setState((s) => ({ ...s, is_public: v }))}
        />
      </div>

      <Button type="submit" disabled={saving}>{saving ? t.saving : t.save}</Button>
    </form>
  );
}
