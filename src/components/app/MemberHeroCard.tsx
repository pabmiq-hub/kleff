import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles, IdCard, ArrowRight, UserPen } from "lucide-react";
import { getMyProfile } from "@/lib/profile.functions";
import { getMyKarmaSummary } from "@/lib/karma.functions";
import { getMyKlefferProfile } from "@/lib/kleffer-profile.functions";
import { levelForKarma, nextLevelForKarma } from "@/lib/karma-levels";
import { useAppLocale } from "@/i18n/app-i18n";

const TEXT = {
  es: {
    hello: "Hola",
    member: "Socio nº",
    since: "Kleffer desde",
    points: "puntos",
    lifetime: "karma acumulado",
    next: "Siguiente nivel",
    maxLevel: "Nivel máximo alcanzado",
    card: "Ver mi carnet",
    karma: "Mi karma",
    completeTitle: "Completa tu perfil de kleffer",
    complete: "Completar perfil",
  },
  ca: {
    hello: "Hola",
    member: "Soci núm.",
    since: "Kleffer des de",
    points: "punts",
    lifetime: "karma acumulat",
    next: "Següent nivell",
    maxLevel: "Nivell màxim assolit",
    card: "Veure el meu carnet",
    karma: "El meu karma",
    completeTitle: "Completa el teu perfil de kleffer",
    complete: "Completar perfil",
  },
  en: {
    hello: "Hi",
    member: "Member no.",
    since: "Kleffer since",
    points: "points",
    lifetime: "lifetime karma",
    next: "Next level",
    maxLevel: "Top level reached",
    card: "View my card",
    karma: "My karma",
    completeTitle: "Complete your kleffer profile",
    complete: "Complete profile",
  },
} as const;

const LOCALE_TAG: Record<string, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

export function MemberHeroCard() {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  const profileFn = useServerFn(getMyProfile);
  const karmaFn = useServerFn(getMyKarmaSummary);
  const [profile, setProfile] = useState<{
    username: string;
    full_name: string;
    avatar_url: string | null;
    member_number: number;
    created_at: string;
  } | null>(null);
  const [karma, setKarma] = useState<{ balance: number; lifetime: number } | null>(null);
  const klefferFn = useServerFn(getMyKlefferProfile);
  const [completion, setCompletion] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void profileFn({ data: undefined as never })
      .then((r) => {
        if (!cancelled && r.profile) setProfile(r.profile as never);
      })
      .catch(() => undefined);
    void karmaFn({ data: undefined as never })
      .then((r) => {
        if (!cancelled) setKarma(r);
      })
      .catch(() => undefined);
    void klefferFn({ data: undefined as never })
      .then((r) => {
        if (cancelled) return;
        const p = r.profile as Record<string, unknown> | null;
        const filled = [
          p?.["attends_alone"],
          p?.["scheduled_games"],
          p?.["experience_level"],
          p?.["teaches"],
          p?.["bio"],
          p?.["goals"],
          p?.["favorite_games"],
          p?.["game_types"],
          p?.["availability"],
          p?.["languages"],
        ].filter((v) =>
          Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : false,
        ).length;
        setCompletion(Math.round((filled / 10) * 100));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profileFn, karmaFn, klefferFn]);

  const level = karma ? levelForKarma(karma.lifetime) : null;
  const next = karma ? nextLevelForKarma(karma.lifetime) : null;
  const levelName =
    level && (locale === "ca" ? level.name_ca : locale === "en" ? level.name_en : level.name);
  const nextName =
    next && (locale === "ca" ? next.name_ca : locale === "en" ? next.name_en : next.name);
  const progress =
    karma && next && level
      ? Math.min(
          100,
          Math.max(
            2,
            Math.round(((karma.lifetime - level.min) / (next.min - level.min)) * 100),
          ),
        )
      : 100;

  const initials = (profile?.full_name ?? profile?.username ?? "K")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="rounded-3xl border-2 border-ink bg-ink text-cream shadow-tactile overflow-hidden">
      <div className="p-6 md:p-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-16 w-16 shrink-0 rounded-2xl border-2 border-cream/30 bg-cream/10 overflow-hidden flex items-center justify-center font-display text-xl font-bold">
            {profile?.avatar_url ? (
              <img loading="lazy" decoding="async" src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold truncate">
              {t.hello}
              {profile ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-cream/70 text-sm mt-0.5">
              {profile ? (
                <>
                  {t.member} {profile.member_number} · {t.since}{" "}
                  {new Date(profile.created_at).toLocaleDateString(LOCALE_TAG[locale] ?? "es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </>
              ) : (
                "…"
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-cream/10 border border-cream/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" /> {levelName ?? "…"}
            </span>
            <span className="text-sm text-cream/80">
              {karma?.balance ?? 0} {t.points}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-cream/15 overflow-hidden">
            <div className="h-full rounded-full bg-coral" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-cream/70">
            {next && karma
              ? `${t.next}: ${nextName} · ${next.min - karma.lifetime} ${t.points}`
              : t.maxLevel}
            {karma ? ` · ${karma.lifetime} ${t.lifetime}` : ""}
          </p>
        </div>
      </div>

      <div className="border-t border-cream/15 px-6 md:px-8 py-3 flex flex-wrap gap-2">
        <Link
          to="/app/carnet"
          className="inline-flex items-center gap-2 text-sm rounded-full bg-cream/10 hover:bg-cream/20 transition-colors px-3 py-1.5"
        >
          <IdCard className="h-4 w-4" /> {t.card}
        </Link>
        <Link
          to="/app/karma"
          className="inline-flex items-center gap-2 text-sm rounded-full bg-coral text-cream hover:bg-coral/90 transition-colors px-3 py-1.5"
        >
          {t.karma} <ArrowRight className="h-4 w-4" />
        </Link>

        {completion !== null && completion < 100 && (
          <Link
            to="/app/profile"
            className="inline-flex items-center gap-3 text-sm rounded-full bg-cream/10 hover:bg-cream/20 transition-colors pl-3 pr-3 py-1.5 min-w-0"
          >
            <UserPen className="h-4 w-4 shrink-0" />
            <span className="truncate">{t.completeTitle}</span>
            <span className="hidden sm:block h-1.5 w-20 rounded-full bg-cream/20 overflow-hidden">
              <span
                className="block h-full rounded-full bg-coral"
                style={{ width: `${Math.max(4, completion)}%` }}
              />
            </span>
            <span className="font-semibold text-cream/80">{completion}%</span>
          </Link>
        )}
      </div>
    </section>
  );
}
