import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Coffee,
  Dice5,
  HandHeart,
  Handshake,
  HeartHandshake,
  MapPin,
  PartyPopper,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { InstagramEmbed } from "@/components/site/InstagramEmbed";
import heroImage from "@/assets/activities-hero.jpg";

const MEETUP_EVENTS_URL =
  "https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming";
const MEETUP_GROUP_URL = "https://www.meetup.com/es-es/kleff-bcn/";
const HANAKA_REEL = "https://www.instagram.com/p/DXbPL40jG8p/";

type BadgeKind = "weekly" | "monthly" | "yearly" | "occasional" | "frequent" | "custom";

function Badge({ kind, label }: { kind: BadgeKind; label: string }) {
  const styles: Record<BadgeKind, string> = {
    weekly: "bg-coral text-cream border-ink",
    monthly: "bg-cream border-ink text-ink",
    yearly: "bg-ink text-cream border-ink",
    occasional: "bg-primary-soft border-ink text-ink",
    frequent: "bg-cream-deep border-ink text-ink",
    custom: "bg-coral-deep text-cream border-ink",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 ${styles[kind]}`}
    >
      {label}
    </span>
  );
}

function DetailCard({
  emoji,
  badgeKind,
  badgeLabel,
  title,
  body,
  href,
  ctaLabel,
}: {
  emoji: string;
  badgeKind: BadgeKind;
  badgeLabel: string;
  title: string;
  body: string;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <article className="relative bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200 flex flex-col h-full">
      <div className="text-5xl leading-none mb-5" aria-hidden>
        {emoji}
      </div>
      <Badge kind={badgeKind} label={badgeLabel} />
      <h3 className="mt-3 text-2xl font-display font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-base text-foreground/75 leading-relaxed flex-1">{body}</p>
      {href && ctaLabel && (
        <Link
          to={href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-coral-deep hover:gap-2.5 transition-all"
        >
          {ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}

export function ActivitiesPage() {
  const { t, locale } = useI18n();
  const a = t.activities;

  const howHref =
    locale === "en" ? "/en/how-it-works" : locale === "ca" ? "/ca/com-funciona" : "/como-funciona";
  const contactHref =
    locale === "en" ? "/en/contact" : locale === "ca" ? "/ca/contacte" : "/contacto";
  const clocktowerHref =
    locale === "en"
      ? "/en/blood-on-the-clocktower"
      : locale === "ca"
        ? "/ca/blood-on-the-clocktower"
        : "/blood-on-the-clocktower";
  const catanHref = locale === "en" ? "/en/catan" : locale === "ca" ? "/ca/catan" : "/catan";
  const hiddenHref =
    locale === "en"
      ? "/en/hidden-roles"
      : locale === "ca"
        ? "/ca/rols-ocults"
        : "/roles-ocultos";
  const tournamentsHref =
    locale === "en" ? "/en/tournaments" : locale === "ca" ? "/ca/tornejos" : "/torneos";

  const innerCommunities = [
    {
      title: "Blood on the Clocktower",
      icon: <Sparkles className="h-5 w-5" />,
      href: clocktowerHref,
    },
    {
      title: "Catan",
      icon: <Dice5 className="h-5 w-5" />,
      href: catanHref,
    },
    {
      title: locale === "en" ? "Hidden Roles" : locale === "ca" ? "Rols Ocults" : "Roles Ocultos",
      icon: <Users className="h-5 w-5" />,
      href: hiddenHref,
    },
    {
      title: locale === "en" ? "Tournaments" : locale === "ca" ? "Tornejos" : "Torneos",
      icon: <Trophy className="h-5 w-5" />,
      href: tournamentsHref,
    },
  ];

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-hidden border-b-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 md:pt-20 pb-16 md:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
              <Sparkles className="h-3.5 w-3.5" />
              {a.eyebrow}
            </span>
            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-display font-semibold leading-[0.98] tracking-tight">
              {a.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-foreground/75 leading-relaxed max-w-xl">
              {a.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={MEETUP_EVENTS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <CalendarDays className="h-5 w-5" />
                {a.ctaMeetup}
              </a>
              <Link
                to={howHref}
                className="inline-flex items-center gap-2 rounded-xl bg-card text-ink border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {a.ctaHow}
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute -top-4 -left-4 size-24 bg-coral/20 rounded-3xl rotate-6" aria-hidden />
            <div className="hidden md:block absolute -bottom-6 -right-6 size-20 bg-ink/10 rounded-2xl -rotate-3" aria-hidden />
            <img
              src={heroImage}
              alt=""
              width={1600}
              height={1024}
              className="relative w-full aspect-[16/10] object-cover rounded-3xl border-2 border-ink shadow-tactile-lg"
            />
          </div>
        </div>
      </section>

      {/* MAIN: GAME NIGHT */}
      <section id="noche-de-juegos" className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-coral text-cream border-2 border-ink px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow-tactile-sm">
                <Calendar className="h-3.5 w-3.5" /> {a.mainEyebrow}
              </span>
              <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
                {a.mainTitle}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm text-sm font-bold">
                  <MapPin className="h-4 w-4 text-coral" /> L'Estació
                </div>
                <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm text-sm font-bold">
                  <Coffee className="h-4 w-4 text-coral" /> {t.how.consumptionBadge}
                </div>
                <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-3 py-2 shadow-tactile-sm text-sm font-bold">
                  <HandHeart className="h-4 w-4 text-coral" /> {t.how.nonProfitTitle}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-5">
              <p className="text-lg text-foreground/80 leading-relaxed">{a.mainBody1}</p>
              <p className="text-lg text-foreground/80 leading-relaxed">{a.mainBody2}</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {innerCommunities.map((c) => (
                  <Link
                    key={c.title}
                    to={c.href}
                    className="group flex items-center justify-between gap-3 bg-card border-2 border-ink rounded-2xl px-4 py-3 shadow-tactile-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile transition-all"
                  >
                    <span className="flex items-center gap-2.5 font-semibold">
                      <span className="text-coral-deep">{c.icon}</span>
                      {c.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-foreground/50 group-hover:text-coral-deep group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
              <a
                href={MEETUP_EVENTS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink text-cream border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                <CalendarDays className="h-5 w-5" />
                {a.mainCta}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* INSIDE GAME NIGHT */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {a.insideTitle}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">
              {a.insideTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">{a.insideSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <DetailCard
              emoji="🏆"
              badgeKind="monthly"
              badgeLabel={a.badgeMonthly}
              title={a.inside1Title}
              body={a.inside1Body}
              href={tournamentsHref}
              ctaLabel={locale === "en" ? "More about tournaments" : locale === "ca" ? "Més sobre tornejos" : "Más sobre torneos"}
            />
            <DetailCard
              emoji="📦"
              badgeKind="monthly"
              badgeLabel={a.badgeMonthly}
              title={a.inside2Title}
              body={a.inside2Body}
            />
            <DetailCard
              emoji="💘"
              badgeKind="occasional"
              badgeLabel={a.badgeOccasional}
              title={a.inside3Title}
              body={a.inside3Body}
            />
          </div>
        </div>
      </section>

      {/* SPECIAL GAME NIGHTS */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mb-14">
            <span className="inline-block bg-coral text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {a.specialEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">
              {a.specialTitle}
            </h2>
            <p className="mt-4 text-lg text-cream/80">{a.specialSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "🎭", title: a.special1Title, body: a.special1Body },
              { emoji: "🎃", title: a.special2Title, body: a.special2Body },
              { emoji: "🎄", title: a.special3Title, body: a.special3Body },
            ].map((s) => (
              <article
                key={s.title}
                className="relative bg-cream/5 backdrop-blur border-2 border-cream/20 rounded-3xl p-7 hover:bg-cream/10 transition-colors"
              >
                <div className="text-5xl mb-5" aria-hidden>
                  {s.emoji}
                </div>
                <Badge kind="yearly" label={a.badgeYearly} />
                <h3 className="mt-3 text-2xl font-display font-semibold leading-tight">{s.title}</h3>
                <p className="mt-3 text-base text-cream/80 leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-10 max-w-3xl text-sm text-cream/70 italic border-l-2 border-coral pl-4">
            {a.specialNote}
          </p>
        </div>
      </section>

      {/* FREQUENT SPECIALS — INSTAGRAM EMBED */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {a.frequentEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-semibold leading-tight">
              {a.frequentTitle}
            </h2>
            <p className="mt-5 text-lg text-foreground/75 leading-relaxed">{a.frequentBody}</p>
            <div className="mt-7 bg-cream-deep/50 border-2 border-ink rounded-2xl p-5 shadow-tactile-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-coral-deep">
                <PartyPopper className="h-4 w-4" />
                {a.badgeFrequent}
              </div>
              <h3 className="mt-2 text-xl font-display font-semibold leading-tight">
                {a.frequentExampleTitle}
              </h3>
              <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
                {a.frequentExampleBody}
              </p>
            </div>
          </div>
          <div>
            <InstagramEmbed url={HANAKA_REEL} caption />
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-16 md:py-20 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-coral text-cream border-2 border-ink shadow-tactile-sm mb-5">
            <Handshake className="h-6 w-6" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-widest text-coral-deep mb-3">
            {a.partnersEyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold leading-tight">
            {a.partnersTitle}
          </h2>
          <p className="mt-5 text-lg text-foreground/75 leading-relaxed max-w-3xl mx-auto">
            {a.partnersBody}
          </p>
        </div>
      </section>

      {/* TEAM BUILDING */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-coral to-coral-deep text-cream border-2 border-ink rounded-3xl p-8 sm:p-12 shadow-tactile-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-40 bg-cream/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2">
                <span className="inline-flex items-center gap-2 bg-cream text-ink text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <HeartHandshake className="h-3.5 w-3.5" /> {a.teamBuildingEyebrow}
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-display font-semibold leading-tight">
                  {a.teamBuildingTitle}
                </h2>
                <p className="mt-4 text-cream/90 leading-relaxed">{a.teamBuildingBody}</p>
              </div>
              <div className="flex md:justify-end">
                <Link
                  to={contactHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink text-cream border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  {a.teamBuildingCta} <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALENDAR FINAL CTA */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 left-1/3 size-96 rounded-full bg-coral/40 blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 size-96 rounded-full bg-coral/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-coral text-cream border-2 border-cream/30 shadow-tactile mb-6">
            <CalendarDays className="h-7 w-7" />
          </div>
          <span className="block text-xs font-bold uppercase tracking-widest text-coral mb-3">
            {a.calendarEyebrow}
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold leading-tight">
            {a.calendarTitle}
          </h2>
          <p className="mt-5 text-lg text-cream/80 leading-relaxed max-w-2xl mx-auto">
            {a.calendarBody}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href={MEETUP_EVENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-cream px-7 py-4 text-lg font-bold shadow-tactile-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
            >
              <CalendarDays className="h-5 w-5" />
              {a.calendarCta}
            </a>
            <a
              href={MEETUP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-transparent text-cream border-2 border-cream/40 px-7 py-4 text-lg font-bold hover:bg-cream/10 transition-all"
            >
              {a.calendarGroup} <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
