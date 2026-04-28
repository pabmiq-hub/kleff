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
  Star,
  Quote,
} from "lucide-react";
import heroImg from "@/assets/hero-gamenight.jpg";
import tableImg from "@/assets/hero-table.jpg";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSectionContent } from "@/cms/useSectionContent";
import { EditableText, EditableImage } from "@/editor/Editable";
import type { MeetupEvent, MeetupGroupStats, GoogleStats } from "@/server/meetup.functions";

// Returns `value` if it's a non-empty string, otherwise `fallback`. Used to
// overlay CMS-edited copy on top of the static i18n dictionaries.
function or(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

type MeetupLoaderData = {
  events: MeetupEvent[];
  stats: MeetupGroupStats;
  google: GoogleStats;
  error: string | null;
  cachedAt: number;
};

function useMeetupData(): MeetupLoaderData {
  const data = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld && Array.isArray(ld.events)) return ld as MeetupLoaderData;
      }
      return null;
    },
  });
  return (
    data ?? {
      events: [],
      stats: { memberCount: null, upcomingEventCount: null, rating: null, ratingCount: null },
      google: { rating: null, ratingCount: null },
      error: null,
      cachedAt: 0,
    }
  );
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
              {typeof event.going === "number" && event.going > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-tighter bg-coral/15 border-2 border-coral/40 text-coral-deep px-2 py-0.5 rounded tabular-nums">
                  {event.going} {locale === "en" ? "going" : locale === "ca" ? "hi van" : "asisten"}
                </span>
              )}
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

type Testimonial = {
  quote: { es: string; en: string; ca: string };
  author: string;
  source: "Meetup" | "Google";
  rating: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote: {
      es: "El mejor plan para conocer gente en Barcelona. Ambiente increíble, te explican cualquier juego y nadie te juzga si eres principiante.",
      en: "The best plan to meet people in Barcelona. Amazing vibe, they teach any game and nobody judges if you're a beginner.",
      ca: "El millor pla per conèixer gent a Barcelona. Ambient increïble, t'expliquen qualsevol joc i ningú no et jutja si ets principiant.",
    },
    author: "Marta R.",
    source: "Google",
    rating: 5,
  },
  {
    quote: {
      es: "Vine sola sin conocer a nadie y a los 10 minutos ya estaba en una mesa riéndome con un grupo. Repetiré seguro.",
      en: "I came alone not knowing anyone and within 10 minutes I was at a table laughing with a group. Will definitely come back.",
      ca: "Vaig venir sola sense conèixer ningú i als 10 minuts ja era en una taula rient amb un grup. Hi tornaré segur.",
    },
    author: "Laura M.",
    source: "Meetup",
    rating: 5,
  },
  {
    quote: {
      es: "Pau y el equipo organizan todo de maravilla. La variedad de juegos es brutal y el sitio (l'Estació) es precioso.",
      en: "Pau and the team organize everything perfectly. The variety of games is huge and the venue (l'Estació) is gorgeous.",
      ca: "En Pau i l'equip ho organitzen tot de meravella. La varietat de jocs és brutal i el lloc (l'Estació) és preciós.",
    },
    author: "David P.",
    source: "Google",
    rating: 5,
  },
  {
    quote: {
      es: "Llevo meses asistiendo. Es la mejor forma de practicar inglés mientras te lo pasas bien. 100% recomendado.",
      en: "I've been coming for months. It's the best way to practice languages while having fun. 100% recommended.",
      ca: "Fa mesos que hi assisteixo. És la millor manera de practicar idiomes mentre t'ho passes bé. 100% recomanat.",
    },
    author: "Andrea S.",
    source: "Meetup",
    rating: 5,
  },
  {
    quote: {
      es: "Increíble la cantidad de juegos que tienen y la paciencia para enseñarte cualquiera. Me encanta el ambiente multilingüe.",
      en: "Incredible amount of games they have and the patience to teach you any of them. I love the multilingual atmosphere.",
      ca: "Increïble la quantitat de jocs que tenen i la paciència per ensenyar-te'n qualsevol. M'encanta l'ambient multilingüe.",
    },
    author: "Sofia T.",
    source: "Google",
    rating: 5,
  },
  {
    quote: {
      es: "La mejor comunidad de juegos de mesa de Barcelona, sin duda. Cada miércoles es un planazo.",
      en: "The best board game community in Barcelona, no doubt. Every Wednesday is a great plan.",
      ca: "La millor comunitat de jocs de taula de Barcelona, sens dubte. Cada dimecres és un planàs.",
    },
    author: "Marc V.",
    source: "Meetup",
    rating: 5,
  },
];

function TestimonialCard({ t, locale }: { t: Testimonial; locale: "es" | "en" | "ca" }) {
  return (
    <figure className="relative bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200 flex flex-col h-full">
      <Quote className="h-8 w-8 text-coral shrink-0" aria-hidden />
      <blockquote className="mt-3 text-base sm:text-lg text-foreground/85 leading-relaxed flex-1">
        “{t.quote[locale]}”
      </blockquote>
      <figcaption className="mt-5 pt-5 border-t-2 border-dashed border-ink/15 flex items-center justify-between gap-3">
        <div>
          <div className="font-display font-semibold text-foreground">{t.author}</div>
          <div className="text-xs font-bold uppercase tracking-wider text-foreground/60">
            {t.source}
          </div>
        </div>
        <div className="flex items-center gap-0.5 text-coral" aria-label={`${t.rating} de 5`}>
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-coral" />
          ))}
        </div>
      </figcaption>
    </figure>
  );
}

function formatNumber(n: number, locale: string) {
  const tag = locale === "en" ? "en-GB" : locale === "ca" ? "ca-ES" : "es-ES";
  return new Intl.NumberFormat(tag).format(n);
}

export function HomePage() {
  const { t, href, locale } = useI18n();
  const { events, stats, google } = useMeetupData();

  // CMS-editable zones (with i18n fallback)
  const hero = useSectionContent("home.hero");
  const pillars = useSectionContent("home.pillars");
  const eventsSec = useSectionContent("home.events");
  const testimonialsSec = useSectionContent<{
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Array<{ quote?: string; author?: string; source?: string }>;
  }>("home.testimonials");
  const reasonsSec = useSectionContent<{
    eyebrow: string;
    title: string;
    image: string;
    imageBadge: string;
    items: Array<{ text?: string }>;
  }>("home.reasons");

  const cmsTestimonials = (testimonialsSec.items ?? []).filter((it) => it?.quote);
  const cmsReasons = (reasonsSec.items ?? []).map((it) => it?.text).filter(Boolean) as string[];

  const reasons = cmsReasons.length
    ? cmsReasons
    : [t.home.reason1, t.home.reason2, t.home.reason3, t.home.reason4, t.home.reason5];

  const memberCount = stats.memberCount ?? 13071;
  const upcoming = stats.upcomingEventCount ?? events.length;
  const rating = stats.rating ?? 4.8;
  const ratingCount = stats.ratingCount ?? 2700;
  const googleRating = google.rating ?? 5.0;
  const googleRatingCount = google.ratingCount;

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-x-clip">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-24 md:pb-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 relative z-10 min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
              <Sparkles className="h-3.5 w-3.5" />
              <EditableText id="home.hero.eyebrow" as="span">{or(hero.eyebrow, t.home.eyebrow)}</EditableText>
            </span>
            <EditableText
              id="home.hero.title"
              as="h1"
              className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-semibold leading-[0.98] sm:leading-[0.95] tracking-normal text-foreground break-words"
            >
              {or(hero.titleA, t.home.titleA)}{" "}
              <span className="marker-coral text-foreground">{or(hero.titleHighlight, t.home.titleHighlight)}</span>{" "}
              {or(hero.titleB, t.home.titleB)}
            </EditableText>
            <EditableText
              id="home.hero.subtitle"
              as="p"
              className="mt-7 text-lg sm:text-xl text-foreground/75 max-w-xl leading-relaxed"
            >
              {or(hero.subtitle, t.home.subtitle)}
            </EditableText>
            <div className="mt-9 flex flex-wrap gap-4 items-center max-w-full">
              <a
                href={or(hero.ctaPrimaryHref, "https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming")}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-coral text-cream border-2 border-ink px-5 py-3.5 sm:px-7 sm:py-4 text-sm sm:text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200 text-center whitespace-normal max-w-full"
              >
                <EditableText id="home.hero.ctaPrimary" as="span">{or(hero.ctaPrimary, t.home.ctaPrimary)}</EditableText>
                <ArrowRight className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to={href("/about")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-card text-foreground border-2 border-ink px-5 py-3.5 sm:px-7 sm:py-4 text-sm sm:text-base font-bold hover:bg-cream-deep transition-colors text-center max-w-full"
              >
                <EditableText id="home.hero.ctaSecondary" as="span">{or(hero.ctaSecondary, t.home.ctaSecondary)}</EditableText>
              </Link>
            </div>

            {/* Live indicator */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-card border-2 border-ink rounded-full font-mono text-xs tabular-nums">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold uppercase tracking-wider">
                {upcoming > 0
                  ? `${upcoming} ${locale === "en" ? "upcoming events" : locale === "ca" ? "esdeveniments" : "eventos próximos"}`
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
              <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden aspect-[4/5]">
                <EditableImage
                  id="home.hero.image"
                  src={(or(hero.image, heroImg) as string)}
                  alt="Comunidad KLEFF jugando juegos de mesa"
                  width={1600}
                  height={2000}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              {/* Floating token: real members from Meetup */}
              <div className="hidden sm:flex absolute -bottom-6 -left-4 size-24 lg:size-28 bg-cream border-4 border-ink rounded-full items-center justify-center shadow-tactile-lg">
                <div className="text-center">
                  <div className="text-xl lg:text-2xl font-display font-bold text-foreground leading-none tabular-nums">
                    {formatNumber(memberCount, locale)}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/60 mt-1">
                    {locale === "en" ? "kleffers" : "kleffers"}
                  </div>
                </div>
              </div>

              {/* Floating token: 500+ games (verified from Meetup description) */}
              <div className="hidden md:flex absolute -top-4 -right-4 bg-coral text-cream border-4 border-ink rounded-2xl px-5 py-3 items-center gap-3 shadow-tactile">
                <Dice5 className="h-7 w-7" />
                <div>
                  <div className="text-xl font-display font-bold leading-none">+500</div>
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
            <EditableText id="home.pillars.eyebrow" as="span" className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {or(pillars.eyebrow, locale === "en" ? "Why Kleff" : locale === "ca" ? "Per què Kleff" : "Por qué Kleff")}
            </EditableText>
            <EditableText id="home.pillars.title" as="h2" className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {or(pillars.title, t.home.pillarsTitle)}
            </EditableText>
            <EditableText id="home.pillars.subtitle" as="p" className="mt-4 text-lg text-foreground/70">{or(pillars.subtitle, t.home.pillarsSubtitle)}</EditableText>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <PillarCard
              icon={<Users className="h-7 w-7" />}
              title={or(pillars.pillar1Title, t.home.pillar1Title)}
              body={or(pillars.pillar1Body, t.home.pillar1Body)}
            />
            <PillarCard
              icon={<Heart className="h-7 w-7" />}
              title={or(pillars.pillar2Title, t.home.pillar2Title)}
              body={or(pillars.pillar2Body, t.home.pillar2Body)}
            />
            <PillarCard
              icon={<Globe2 className="h-7 w-7" />}
              title={or(pillars.pillar3Title, t.home.pillar3Title)}
              body={or(pillars.pillar3Body, t.home.pillar3Body)}
            />
          </div>
        </div>
      </section>

      {/* EVENTS — only the next 3 + CTA to Meetup */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
            <div>
              <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
                <Calendar className="h-3.5 w-3.5" /> Meetup
              </span>
              <EditableText id="home.events.title" as="h2" className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
                {or(eventsSec.title, t.home.eventsTitle)}
              </EditableText>
              <EditableText id="home.events.subtitle" as="p" className="mt-4 text-lg text-foreground/70 max-w-xl">{or(eventsSec.subtitle, t.home.eventsSubtitle)}</EditableText>
            </div>
            <a
              href="https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-2 px-5 py-3 border-2 border-ink rounded-full text-sm font-bold bg-card hover:bg-cream-deep transition-colors shadow-tactile-sm"
            >
              {or(eventsSec.ctaText, t.home.eventsCta)}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {events.length === 0 ? (
            <div className="rounded-3xl border-2 border-ink bg-card p-12 text-center text-foreground/70 shadow-tactile">
              {t.home.eventsEmpty}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.slice(0, 3).map((e) => (
                <EventCard key={e.id} event={e} locale={locale} joinLabel={t.home.eventJoin} />
              ))}
            </div>
          )}

          {/* Bottom CTA reinforcing the link to all events */}
          {events.length > 3 && (
            <div className="mt-12 flex justify-center">
              <a
                href="https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200"
              >
                {locale === "en"
                  ? `See all ${upcoming} upcoming events`
                  : locale === "ca"
                    ? `Veure tots els ${upcoming} esdeveniments`
                    : `Ver los ${upcoming} próximos eventos`}
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              <Star className="h-3.5 w-3.5 fill-cream" /> {or(testimonialsSec.eyebrow, t.home.testimonialsEyebrow)}
            </span>
            <EditableText id="home.testimonials.title" as="h2" className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-tight">
              {or(testimonialsSec.title, t.home.testimonialsTitle)}
            </EditableText>
            <EditableText id="home.testimonials.subtitle" as="p" className="mt-4 text-lg text-foreground/70">{or(testimonialsSec.subtitle, t.home.testimonialsSubtitle)}</EditableText>
          </div>

          {/* Rating summary chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-4 py-2 shadow-tactile-sm">
              <Star className="h-4 w-4 text-coral fill-coral" />
              <span className="font-display font-bold text-lg tabular-nums">
                {rating.toFixed(1).replace(".", locale === "en" ? "." : ",")}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Meetup · {formatNumber(ratingCount, locale)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-4 py-2 shadow-tactile-sm">
              <Star className="h-4 w-4 text-coral fill-coral" />
              <span className="font-display font-bold text-lg tabular-nums">
                {googleRating.toFixed(1).replace(".", locale === "en" ? "." : ",")}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Google{googleRatingCount != null ? ` · ${formatNumber(googleRatingCount, locale)}` : ""}
              </span>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsTestimonials.length > 0
              ? cmsTestimonials.map((it, i) => (
                  <TestimonialCard
                    key={i}
                    t={{
                      quote: { es: it.quote ?? "", en: it.quote ?? "", ca: it.quote ?? "" },
                      author: it.author ?? "",
                      source: (it.source === "Meetup" ? "Meetup" : "Google") as "Meetup" | "Google",
                      rating: 5,
                    }}
                    locale={locale}
                  />
                ))
              : TESTIMONIALS.map((t, i) => <TestimonialCard key={i} t={t} locale={locale} />)}
          </div>

          <div className="mt-12 flex flex-wrap gap-4">
            <a
              href="https://www.meetup.com/kleff-bcn/feedback-overview/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 border-2 border-ink rounded-full text-sm font-bold bg-card hover:bg-cream-deep transition-colors shadow-tactile-sm"
            >
              {t.home.testimonialsMeetup}
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://maps.app.goo.gl/FwLT8EYGGDJYxGhs5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 border-2 border-ink rounded-full text-sm font-bold bg-card hover:bg-cream-deep transition-colors shadow-tactile-sm"
            >
              {t.home.testimonialsGoogle}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* REASONS + IMAGE */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="relative border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden">
              <EditableImage
                id="home.reasons.image"
                src={or(reasonsSec.image, tableImg) as string}
                alt="Mesa de juegos KLEFF"
                width={1200}
                height={1400}
                loading="lazy"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="mt-4 inline-block bg-cream border-2 border-ink rounded-2xl px-4 py-2 shadow-tactile-sm">
              <p className="font-display font-bold text-sm">
                {or(reasonsSec.imageBadge, locale === "en" ? "100% real cardboard" : locale === "ca" ? "100% cartró real" : "100% cartón real")}
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {or(reasonsSec.eyebrow, t.home.reasonsEyebrow)}
            </span>
            <EditableText id="home.reasons.title" as="h2" className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-[1.05]">
              {or(reasonsSec.title, t.home.reasonsTitle)}
            </EditableText>
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
    </SiteLayout>
  );
}
