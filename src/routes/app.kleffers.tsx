import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listKleffers, getKlefferProfile } from "@/lib/kleffers.functions";
import { Input } from "@/components/ui/input";
import { MemberBadgesRow } from "@/components/app/badges/MemberBadgesRow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, ExternalLink, X, SlidersHorizontal, Dice5, Users, GraduationCap, CalendarClock, Languages, Target, Sparkles } from "lucide-react";
import { AVAILABILITY, GAME_TYPES, EXPERIENCE, LANGUAGES, GOALS } from "@/lib/kleffer-profile-options";
import { useAppLocale } from "@/i18n/app-i18n";
import {
  communityDict,
  klefferOptionLabels,
  klefferLabelOf,
  klefferLabelsOf,
} from "@/i18n/app/community";

export const Route = createFileRoute("/app/kleffers")({
  head: () => ({
    meta: [
      { title: "Comunidad — Zona socios" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KleffersPage,
});

interface KlefferExtended {
  attends_alone?: string | null;
  goals?: string[] | null;
  favorite_games?: Array<{ id: string; name: string; imageUrl?: string | null }> | null;
  game_types?: string[] | null;
  availability?: string[] | null;
  experience_level?: string | null;
  languages?: string[] | null;
  teaches?: string | null;
  scheduled_games?: string | null;
  bio?: string | null;
}

interface Kleffer {
  id: string;
  username: string;
  avatar_url: string | null;
  ludoya_username: string | null;
  ludoya_display_name: string | null;
  ludoya_avatar_url: string | null;
  member_number: number;
  created_at: string;
  extended: KlefferExtended | null;
}

interface LudoyaMember {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  stats: Record<string, number> | null;
  collection: Array<{ id?: string; name?: string; imageUrl?: string | null }>;
}

function GameThumb({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  return (
    <div
      title={name}
      className={`relative shrink-0 overflow-hidden rounded-lg bg-cream-deep ring-1 ring-ink/10 ${className}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-base">🎲</div>
      )}
    </div>
  );
}

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "coral" }) {
  return (
    <span
      className={
        tone === "coral"
          ? "rounded-full bg-coral/15 px-2 py-0.5 text-xs font-medium text-coral-deep"
          : "rounded-full bg-cream-deep/70 px-2 py-0.5 text-xs text-ink/75"
      }
    >
      {children}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function KleffersPage() {
  const { locale } = useAppLocale();
  const t = communityDict[locale].kleffers;
  const opt = klefferOptionLabels[locale];
  const fn = useServerFn(listKleffers);
  const detailFn = useServerFn(getKlefferProfile);
  const [items, setItems] = useState<Kleffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyLudoya, setOnlyLudoya] = useState(false);
  const [availability, setAvailability] = useState("");
  const [gameType, setGameType] = useState("");
  const [experience, setExperience] = useState("");
  const [language, setLanguage] = useState("");
  const [goal, setGoal] = useState("");

  const [selected, setSelected] = useState<Kleffer | null>(null);
  const [ludoya, setLudoya] = useState<LudoyaMember | null>(null);
  const [extended, setExtended] = useState<KlefferExtended | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then((r) => setItems(r.kleffers as Kleffer[]))
      .finally(() => setLoading(false));
  }, [fn]);

  const open = (k: Kleffer) => {
    setSelected(k);
    setLudoya(null);
    setExtended(k.extended);
    setDetailLoading(true);
    void detailFn({ data: { id: k.id } })
      .then((r) => {
        setLudoya((r.ludoya as LudoyaMember | null) ?? null);
        setExtended((r.extended as KlefferExtended | null) ?? null);
      })
      .catch(() => setLudoya(null))
      .finally(() => setDetailLoading(false));
  };

  const filtered = useMemo(
    () =>
      items.filter((k) => {
        const e = k.extended;
        if (onlyLudoya && !k.ludoya_username) return false;
        if (availability && !(e?.availability ?? []).includes(availability)) return false;
        if (gameType && !(e?.game_types ?? []).includes(gameType)) return false;
        if (experience && e?.experience_level !== experience) return false;
        if (language && !(e?.languages ?? []).includes(language)) return false;
        if (goal && !(e?.goals ?? []).includes(goal)) return false;
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return (
          k.username.toLowerCase().includes(s) ||
          (k.ludoya_username?.toLowerCase().includes(s) ?? false) ||
          (k.ludoya_display_name?.toLowerCase().includes(s) ?? false) ||
          (e?.favorite_games ?? []).some((g) => g.name.toLowerCase().includes(s))
        );
      }),
    [items, onlyLudoya, availability, gameType, experience, language, goal, q],
  );

  const activeFilters =
    (onlyLudoya ? 1 : 0) +
    [availability, gameType, experience, language, goal].filter(Boolean).length;

  const clearAll = () => {
    setOnlyLudoya(false);
    setAvailability("");
    setGameType("");
    setExperience("");
    setLanguage("");
    setGoal("");
    setQ("");
  };

  const selectCls =
    "h-9 rounded-full border border-ink/15 bg-card px-3 text-sm text-ink/80 focus:outline-none focus:ring-2 focus:ring-coral/40";

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.title}</h1>
          <p className="mt-1 text-ink/60">{t.subtitle(items.length)}</p>
        </div>
      </header>

      {/* Filtros */}
      <div className="space-y-3 rounded-2xl border border-ink/10 bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
            <SlidersHorizontal className="h-3.5 w-3.5" /> {t.filters}
          </span>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 text-xs text-coral-deep hover:underline"
            >
              <X className="h-3 w-3" /> {t.clearFilters}
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="rounded-full pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={gameType} onChange={(e) => setGameType(e.target.value)} className={selectCls}>
            <option value="">{t.anyGameType}</option>
            {GAME_TYPES.map((g) => (
              <option key={g.value} value={g.value}>
                {klefferLabelOf(opt.game_types, g.value)}
              </option>
            ))}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectCls}>
            <option value="">{t.anyAvailability}</option>
            {AVAILABILITY.map((a) => (
              <option key={a.value} value={a.value}>
                {klefferLabelOf(opt.availability, a.value)}
              </option>
            ))}
          </select>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className={selectCls}>
            <option value="">{t.anyExperience}</option>
            {EXPERIENCE.map((x) => (
              <option key={x.value} value={x.value}>
                {klefferLabelOf(opt.experience_level, x.value)}
              </option>
            ))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
            <option value="">{t.anyLanguage}</option>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {klefferLabelOf(opt.languages, l.value)}
              </option>
            ))}
          </select>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className={selectCls}>
            <option value="">{t.anyGoal}</option>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {klefferLabelOf(opt.goals, g.value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={onlyLudoya}
              onChange={(e) => setOnlyLudoya(e.target.checked)}
              className="accent-coral"
            />
            {t.onlyLudoya}
          </label>
          <span className="ml-auto self-center text-xs text-ink/50">{t.results(filtered.length)}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-ink/60">{t.loading}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((k) => {
            const e = k.extended;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => open(k)}
                className="group flex items-center gap-3 rounded-2xl border border-ink/10 bg-card p-4 text-left transition-colors hover:border-coral"
              >
                {k.avatar_url || k.ludoya_avatar_url ? (
                  <img loading="lazy" decoding="async"
                    src={k.avatar_url ?? k.ludoya_avatar_url ?? ""}
                    alt={`@${k.username}`}
                    className="h-12 w-12 shrink-0 rounded-full border-2 border-coral object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral/25 text-lg font-bold">
                    {k.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">@{k.username}</p>
                  <p className="text-xs text-ink/50">
                    {t.memberNumber} {k.member_number}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {k.ludoya_username ? <Chip tone="coral">{t.inLudoya}</Chip> : <Chip>{t.noLudoya}</Chip>}
                    {e?.experience_level && <Chip>{klefferLabelOf(opt.experience_level, e.experience_level)}</Chip>}
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-ink/50">{t.noResults}</p>
          )}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">@{selected.username}</SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <MemberBadgesRow userId={selected.id} />
                <div className="flex items-center gap-4">
                  {selected.avatar_url || selected.ludoya_avatar_url ? (
                    <img loading="lazy" decoding="async"
                      src={selected.avatar_url ?? selected.ludoya_avatar_url ?? ""}
                      alt=""
                      className="h-20 w-20 rounded-full border-2 border-coral object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-coral/30 text-2xl font-bold">
                      {selected.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-sm text-ink/70">
                    <p>
                      {t.memberNumber}{" "}
                      <span className="font-mono font-semibold text-ink">{selected.member_number}</span>
                    </p>
                    <p>
                      {t.since}{" "}
                      {new Date(selected.created_at).toLocaleDateString(communityDict[locale].dateLocale)}
                    </p>
                  </div>
                </div>

                {extended?.bio && (
                  <p className="rounded-2xl bg-cream-deep/50 p-3 text-sm italic text-ink/70">“{extended.bio}”</p>
                )}

                {extended && (
                  <Section icon={Users} title={t.profileTitle}>
                    <ul className="space-y-1.5 text-sm text-ink/80">
                      {extended.attends_alone && <li>{klefferLabelOf(opt.attends_alone, extended.attends_alone)}</li>}
                      {extended.scheduled_games && (
                        <li>{klefferLabelOf(opt.scheduled_games, extended.scheduled_games)}</li>
                      )}
                      {extended.experience_level && (
                        <li className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                          {t.level}: {klefferLabelOf(opt.experience_level, extended.experience_level)}
                        </li>
                      )}
                      {extended.teaches && (
                        <li className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-ink/40" />
                          {klefferLabelOf(opt.teaches, extended.teaches)}
                        </li>
                      )}
                    </ul>
                  </Section>
                )}

                {(extended?.favorite_games ?? []).length > 0 && (
                  <Section icon={Dice5} title={t.favoriteGames}>
                    <div className="grid grid-cols-2 gap-2">
                      {(extended?.favorite_games ?? []).map((g) => (
                        <div key={g.id} className="flex items-center gap-2 rounded-xl bg-cream-deep/40 p-1.5">
                          <GameThumb name={g.name} imageUrl={g.imageUrl} className="h-11 w-11" />
                          <span className="min-w-0 truncate text-xs font-medium">{g.name}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {[
                  { icon: Target, title: t.goals, items: klefferLabelsOf(opt.goals, extended?.goals) },
                  { icon: Dice5, title: t.likes, items: klefferLabelsOf(opt.game_types, extended?.game_types) },
                  {
                    icon: CalendarClock,
                    title: t.availability,
                    items: klefferLabelsOf(opt.availability, extended?.availability),
                  },
                  { icon: Languages, title: t.languages, items: klefferLabelsOf(opt.languages, extended?.languages) },
                ]
                  .filter((b) => b.items.length > 0)
                  .map((b) => (
                    <Section key={b.title} icon={b.icon} title={b.title}>
                      <div className="flex flex-wrap gap-1.5">
                        {b.items.map((it) => (
                          <Chip key={it}>{it}</Chip>
                        ))}
                      </div>
                    </Section>
                  ))}

                <Section icon={ExternalLink} title={t.ludoya}>
                  {!selected.ludoya_username ? (
                    <p className="text-sm text-ink/50">{t.notLinked}</p>
                  ) : detailLoading ? (
                    <p className="text-sm text-ink/50">{t.loadingLudoya}</p>
                  ) : (
                    <div className="space-y-3">
                      <a
                        href={`https://app.ludoya.com/${selected.ludoya_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-sm underline"
                      >
                        @{selected.ludoya_username} <ExternalLink className="h-3 w-3" />
                      </a>
                      {ludoya?.name && <p className="text-sm">{ludoya.name}</p>}
                      {ludoya?.stats && Object.keys(ludoya.stats).length > 0 && (
                        <ul className="grid grid-cols-2 gap-2 text-xs text-ink/70">
                          {Object.entries(ludoya.stats).map(([k, v]) => (
                            <li key={k} className="rounded-lg bg-cream-deep/50 px-2 py-1">
                              <span className="capitalize">{k}</span>: <strong>{v}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                      {ludoya && ludoya.collection.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs uppercase tracking-wide text-ink/50">{t.collection}</p>
                          <div className="grid grid-cols-4 gap-2">
                            {ludoya.collection.map((g, i) => (
                              <GameThumb
                                key={g.id ?? i}
                                name={g.name ?? ""}
                                imageUrl={g.imageUrl}
                                className="aspect-square h-auto w-full"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
