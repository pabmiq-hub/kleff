import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Dice5,
  Heart,
  Globe2,
} from "lucide-react";
import heroImg from "@/assets/hero-gamenight.jpg";
import tableImg from "@/assets/hero-table.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import type { MeetupEvent } from "@/server/meetup.functions";

type MeetupLoaderData = {
  events: MeetupEvent[];
  error: string | null;
  cachedAt: number;
};

function useMeetupEvents(): MeetupLoaderData {
  const data = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld && Array.isArray(ld.events)) return ld as MeetupLoaderData;
      }
      return null;
    },
  });
  return data ?? { events: [], error: null, cachedAt: 0 };
}

function PillarCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative bg-card p-7 border-2 border-ink rounded-3xl shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200">
      <div className="h-14 w-14 rounded-2xl bg-coral text-cream border-2 border-ink flex items-center justify-center shadow-tactile-sm">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-base text-foreground/70 leading-relaxed">{body}</p>
    </div>
  );
}

function EventCard({
  event,
  locale,
  joinLabel,
}: {
  event: MeetupEvent;
  locale: string;
  joinLabel: string;
}) {
  const date = new Date(event.dateTime);
  const localeTag = locale === "ca" ? "ca-ES" : locale === "en" ? "en-GB" : "es-ES";
  const day = date.toLocaleDateString(localeTag, { weekday: "short", timeZone: "Europe/Madrid" });
  const num = date.toLocaleDateString(localeTag, { day: "numeric", timeZone: "Europe/Madrid" });
  const month = date.toLocaleDateString(localeTag, { month: "short", timeZone: "Europe/Madrid" });
  const time = date.toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
  const endTime = event.endTime
    ? new Date(event.endTime).toLocaleTimeString(localeTag, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
      })
    : null;

  return (
    <article className="group relative bg-card border-2 border-ink rounded-3xl shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200 overflow-hidden">
      {event.imageUrl && (
        <div className="relative aspect-[16/10] border-b-2 border-ink overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Date chip */}
          <div className="shrink-0 flex flex-col items-center justify-center w-20 py-2 bg-cream border-2 border-coral rounded-2xl shadow-tactile-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-coral-deep leading-none">
              {day.replace(".", "")}
            </span>
            <span className="text-3xl font-display font-bold text-coral tabular-nums leading-none mt-1">
              {num}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 leading-none mt-1">
              {month.replace(".", "")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-tighter bg-ink text-cream px-2 py-0.5 rounded">
                Game Night
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter border-2 border-ink px-2 py-0.5 rounded tabular-nums">
                {time}
                {endTime ? ` – ${endTime}` : ""}
              </span>
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground line-clamp-2 leading-snug">
              {event.title}
            </h3>
            {(event.venueName || event.venueAddress) && (
              <p className="mt-2 text-sm text-foreground/70 flex items-start gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-coral" />
                <span className="line-clamp-2">
                  {event.venueName}
                  {event.venueAddress ? ` · ${event.venueAddress}` : ""}
                </span>
              </p>
            )}
          </div>
        </div>

        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-bold hover:bg-coral transition-colors w-full sm:w-auto"
        >
          {joinLabel}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

export function HomePage() {
  const { t, href, locale } = useI18n();
  const { events } = useMeetupEvents();

  const reasons = [t.home.reason1, t.home.reason2, t.home.reason3, t.home.reason4, t.home.reason5];

  const stats = [
    { value: "200+", label: t.home.statAttendees },
    { value: "300+", label: t.home.statGames },
    { value: "4h", label: t.home.statHours },
    { value: "+25%", label: t.home.statGrowth },
  ];


  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-x-clip">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-24 md:pb-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 relative z-10 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
              <Sparkles className="h-3.5 w-3.5" /> {t.home.eyebrow}
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-semibold leading-[0.98] sm:leading-[0.95] tracking-normal text-foreground break-words">
              {t.home.titleA}{" "}
              <span className="marker-coral text-foreground">{t.home.titleHighlight}</span>{" "}
              {t.home.titleB}
            </h1>
            <p className="mt-7 text-lg sm:text-xl text-foreground/75 max-w-xl leading-relaxed">
              {t.home.subtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-4 items-center max-w-full">
              <a
                href="https://www.meetup.com/es-es/kleff-bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-coral text-cream border-2 border-ink px-5 py-3.5 sm:px-7 sm:py-4 text-sm sm:text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200 text-center whitespace-normal max-w-full"
              >
                <span>{t.home.ctaPrimary}</span>
                <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to={href("/about")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-card text-foreground border-2 border-ink px-5 py-3.5 sm:px-7 sm:py-4 text-sm sm:text-base font-bold hover:bg-cream-deep transition-colors text-center max-w-full"
              >
                {t.home.ctaSecondary}
              </Link>
            </div>

            {/* Live indicator */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-card border-2 border-ink rounded-full font-mono text-xs tabular-nums">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold uppercase tracking-wider">
                {events.length > 0
                  ? `${events.length} ${locale === "en" ? "upcoming events" : locale === "ca" ? "esdeveniments" : "eventos próximos"}`
                  : locale === "en"
                    ? "Community active in BCN"
                    : locale === "ca"
                      ? "Comunitat activa a BCN"
                      : "Comunidad activa en BCN"}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative">
              {/* Main image with hard border + tactile shadow */}
              <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden aspect-[4/5]">
                <img
                  src={heroImg}
                  alt="Comunidad KLEFF jugando juegos de mesa"
                  width={1600}
                  height={2000}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Floating token: community */}
              <div className="hidden sm:flex absolute -bottom-6 -left-4 size-24 lg:size-28 bg-cream border-4 border-ink rounded-full items-center justify-center shadow-tactile-lg">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-foreground leading-none">10K+</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/60 mt-1">
                    {locale === "en" ? "people" : locale === "ca" ? "persones" : "personas"}
                  </div>
                </div>
              </div>

              {/* Floating token: games */}
              <div className="hidden md:flex absolute -top-4 -right-4 bg-coral text-cream border-4 border-ink rounded-2xl px-5 py-3 items-center gap-3 shadow-tactile">
                <Dice5 className="h-7 w-7" />
                <div>
                  <div className="text-xl font-display font-bold leading-none">300+</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-90">
                    {locale === "en" ? "games" : locale === "ca" ? "jocs" : "juegos"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {locale === "en" ? "Why Kleff" : locale === "ca" ? "Per què Kleff" : "Por qué Kleff"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {t.home.pillarsTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">{t.home.pillarsSubtitle}</p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <PillarCard
              icon={<Users className="h-7 w-7" />}
              title={t.home.pillar1Title}
              body={t.home.pillar1Body}
            />
            <PillarCard
              icon={<Heart className="h-7 w-7" />}
              title={t.home.pillar2Title}
              body={t.home.pillar2Body}
            />
            <PillarCard
              icon={<Globe2 className="h-7 w-7" />}
              title={t.home.pillar3Title}
              body={t.home.pillar3Body}
            />
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
            <div>
              <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
                <Calendar className="h-3.5 w-3.5" /> Meetup
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
                {t.home.eventsTitle}
              </h2>
              <p className="mt-4 text-lg text-foreground/70 max-w-xl">{t.home.eventsSubtitle}</p>
            </div>
            <a
              href="https://www.meetup.com/es-es/kleff-bcn/events/"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 px-5 py-3 border-2 border-ink rounded-full text-sm font-bold bg-card hover:bg-cream-deep transition-colors"
            >
              {t.home.eventsCta}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border-2 border-ink bg-card p-12 text-center text-foreground/70 shadow-tactile">
              {t.home.eventsEmpty}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 6).map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  locale={locale}
                  joinLabel={t.home.eventJoin}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* REASONS + IMAGE */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden rotate-2">
              <img
                src={tableImg}
                alt="Mesa de juegos KLEFF"
                width={1200}
                height={1400}
                loading="lazy"
                className="w-full h-[500px] object-cover"
              />
              <div className="tape -top-2 left-10 -rotate-3" />
              <div className="tape -bottom-2 right-12 rotate-3" />
            </div>
            {/* Stamp annotation */}
            <div className="absolute -bottom-6 -right-4 bg-cream border-2 border-ink rounded-2xl px-4 py-2 -rotate-6 shadow-tactile-sm">
              <p className="font-display font-bold text-sm">
                {locale === "en" ? "100% real cardboard" : locale === "ca" ? "100% cartró real" : "100% cartón real"}
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {t.home.reasonsEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-[1.05]">
              {t.home.reasonsTitle}
            </h2>
            <ul className="mt-10 space-y-4">
              {reasons.map((r, i) => {
                const emoji = r.split(" ")[0];
                const text = r.split(" ").slice(1).join(" ");
                return (
                  <li
                    key={i}
                    className="flex gap-4 p-5 rounded-2xl bg-card border-2 border-ink shadow-tactile-sm hover:translate-x-1 hover:-translate-y-1 transition-transform"
                  >
                    <span className="shrink-0 size-12 rounded-xl bg-coral/15 border-2 border-coral/40 flex items-center justify-center text-2xl">
                      {emoji}
                    </span>
                    <span className="text-base text-foreground/85 leading-relaxed self-center">
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        {/* Decorative coral squares */}
        <div className="absolute top-10 left-10 size-16 bg-coral border-4 border-cream/20 rounded-2xl rotate-12 hidden md:block" />
        <div className="absolute bottom-10 right-20 size-20 bg-coral/40 border-4 border-cream/20 rounded-full -rotate-6 hidden md:block" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <span className="inline-block bg-coral text-cream px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
            {locale === "en" ? "By the numbers" : locale === "ca" ? "En xifres" : "En cifras"}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-cream max-w-2xl leading-tight">
            {t.home.statsTitle}
          </h2>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`p-6 border-2 border-cream/20 rounded-3xl ${i % 2 === 0 ? "bg-cream/5" : "bg-coral/10"}`}
              >
                <div className="text-5xl sm:text-6xl font-display font-bold text-coral tabular-nums">
                  {s.value}
                </div>
                <div className="mt-3 text-sm font-medium text-cream/80 uppercase tracking-wide">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-coral border-4 border-ink rounded-[2.5rem] px-8 sm:px-16 py-16 sm:py-20 text-center shadow-tactile-lg -rotate-1">
            {/* Decorative corner stickers */}
            <div className="hidden sm:block absolute -top-5 -left-5 size-16 bg-cream border-4 border-ink rounded-full flex items-center justify-center font-display font-bold text-2xl rotate-12 shadow-tactile-sm">
              <Dice5 className="h-7 w-7 text-coral" />
            </div>
            <div className="hidden sm:flex absolute -bottom-5 -right-5 size-16 bg-ink border-4 border-cream rounded-full items-center justify-center -rotate-12 shadow-tactile-sm">
              <Sparkles className="h-7 w-7 text-coral" />
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-cream leading-tight">
              {t.home.joinTitle}
            </h2>
            <p className="mt-5 text-lg text-cream/95 max-w-xl mx-auto">{t.home.joinSubtitle}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href="https://www.meetup.com/es-es/kleff-bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-cream text-foreground border-2 border-ink px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200"
              >
                Meetup
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-7 py-4 text-base font-bold hover:bg-foreground transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
