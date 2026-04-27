import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Dice5,
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
  // Index routes (es/en/ca) load events. Pick the match that has events data.
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
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-20 md:pb-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
              <Sparkles className="h-3.5 w-3.5" /> {t.home.eyebrow}
            </span>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-display font-semibold leading-[0.95] text-foreground">
              {t.home.titleA}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 italic text-coral-deep">{t.home.titleHighlight}</span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full h-3 text-coral/40"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 8 Q 50 2, 100 6 T 198 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              <br className="hidden sm:block" />
              {t.home.titleB}
            </h1>
            <p className="mt-6 text-lg text-foreground/75 max-w-xl leading-relaxed">
              {t.home.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.meetup.com/kleff/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-coral text-primary-foreground px-6 py-3.5 text-sm font-semibold shadow-glow hover:shadow-warm hover:-translate-y-0.5 transition-all"
              >
                {t.home.ctaPrimary}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to={href("/about")}
                className="inline-flex items-center gap-2 rounded-full bg-cream-deep px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                {t.home.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-coral rounded-[2.5rem] blur-2xl opacity-30" />
              <img
                src={heroImg}
                alt="Comunidad KLEFF jugando juegos de mesa"
                width={1600}
                height={1200}
                className="relative rounded-3xl shadow-warm w-full h-[420px] sm:h-[500px] object-cover"
              />
              {/* Floating stat card */}
              <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-cream rounded-2xl shadow-warm px-5 py-4 items-center gap-3 border border-border/40">
                <div className="h-12 w-12 rounded-xl bg-coral/15 flex items-center justify-center">
                  <Users className="h-6 w-6 text-coral-deep" />
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-foreground">10K+</div>
                  <div className="text-xs text-muted-foreground">comunidad activa</div>
                </div>
              </div>
              <div className="hidden md:flex absolute -top-6 -right-6 bg-cream rounded-2xl shadow-warm px-5 py-4 items-center gap-3 border border-border/40">
                <div className="h-12 w-12 rounded-xl bg-accent/30 flex items-center justify-center">
                  <Dice5 className="h-6 w-6 text-coral-deep" />
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-foreground">300+</div>
                  <div className="text-xs text-muted-foreground">juegos de mesa</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-display font-semibold text-foreground">
              {t.home.pillarsTitle}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t.home.pillarsSubtitle}</p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            <PillarCard
              icon={<Users className="h-6 w-6" />}
              title={t.home.pillar1Title}
              body={t.home.pillar1Body}
            />
            <PillarCard
              icon={<MapPin className="h-6 w-6" />}
              title={t.home.pillar2Title}
              body={t.home.pillar2Body}
            />
            <PillarCard
              icon={<Sparkles className="h-6 w-6" />}
              title={t.home.pillar3Title}
              body={t.home.pillar3Body}
            />
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="py-20 md:py-24 bg-cream-deep/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-coral-deep">
                <Calendar className="h-3.5 w-3.5" /> Meetup
              </span>
              <h2 className="mt-3 text-4xl sm:text-5xl font-display font-semibold text-foreground">
                {t.home.eventsTitle}
              </h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl">
                {t.home.eventsSubtitle}
              </p>
            </div>
            <a
              href="https://www.meetup.com/es-es/kleff-bcn/events/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-coral-deep hover:text-coral transition-colors"
            >
              {t.home.eventsCta}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {events.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-muted-foreground">
              {t.home.eventsEmpty}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1">
            <img
              src={tableImg}
              alt="Mesa de juegos KLEFF"
              width={1200}
              height={1400}
              loading="lazy"
              className="rounded-3xl shadow-warm w-full h-[500px] object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
              {t.home.reasonsEyebrow}
            </span>
            <h2 className="mt-5 text-4xl sm:text-5xl font-display font-semibold text-foreground leading-tight">
              {t.home.reasonsTitle}
            </h2>
            <ul className="mt-8 space-y-4">
              {reasons.map((r, i) => (
                <li
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-coral/40 hover:shadow-soft transition-all"
                >
                  <span className="text-2xl shrink-0">{r.split(" ")[0]}</span>
                  <span className="text-base text-foreground/85 leading-relaxed">
                    {r.split(" ").slice(1).join(" ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 md:py-24 bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold text-cream max-w-2xl">
            {t.home.statsTitle}
          </h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-5xl sm:text-6xl font-display font-bold text-coral">
                  {s.value}
                </div>
                <div className="mt-2 text-sm text-cream/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-coral px-8 sm:px-16 py-16 sm:py-20 text-center shadow-warm">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cream/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cream/10 blur-3xl" />
            <h2 className="relative text-4xl sm:text-5xl font-display font-semibold text-cream">
              {t.home.joinTitle}
            </h2>
            <p className="relative mt-4 text-lg text-cream/90 max-w-xl mx-auto">
              {t.home.joinSubtitle}
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="https://www.meetup.com/kleff/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3.5 text-sm font-semibold text-coral-deep hover:bg-cream-deep transition-colors"
              >
                Meetup
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-cream/15 backdrop-blur px-6 py-3.5 text-sm font-semibold text-cream hover:bg-cream/25 transition-colors border border-cream/30"
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

function PillarCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group relative p-7 rounded-3xl bg-card border border-border/60 hover:border-coral/40 hover:shadow-warm hover:-translate-y-1 transition-all duration-300">
      <div className="h-12 w-12 rounded-2xl bg-coral/15 text-coral-deep flex items-center justify-center group-hover:bg-coral group-hover:text-cream transition-colors">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-display font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function EventCardPlaceholder({ index }: { index: number }) {
  // Visual placeholder until Meetup API is wired (next iteration)
  const labels = [
    { day: "JUE", num: "—", title: "Game Night", time: "19:00 – 23:00" },
    { day: "SÁB", num: "—", title: "Torneo Catan", time: "17:00 – 21:00" },
    { day: "MIÉ", num: "—", title: "Blood on the Clocktower", time: "19:30 – 22:30" },
  ];
  const e = labels[index];
  return (
    <a
      href="https://www.meetup.com/kleff/"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-5 p-5 rounded-2xl bg-card border border-border/60 hover:border-coral/40 hover:shadow-soft transition-all"
    >
      <div className="shrink-0 w-16 h-16 rounded-xl bg-coral/10 flex flex-col items-center justify-center text-coral-deep">
        <span className="text-[10px] font-bold uppercase tracking-wider">{e.day}</span>
        <span className="text-2xl font-display font-bold leading-none">{e.num}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-coral-deep uppercase tracking-wider">
          L'Estació de França
        </div>
        <h3 className="mt-1 text-lg font-display font-semibold text-foreground line-clamp-1">
          {e.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{e.time}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-coral group-hover:translate-x-1 transition-all self-center" />
    </a>
  );
}
