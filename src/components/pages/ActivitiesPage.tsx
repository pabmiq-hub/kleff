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
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { InstagramEmbed } from "@/components/site/InstagramEmbed";
import { EditableText } from "@/editor/Editable";

const MEETUP_EVENTS_URL =
  "https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming";
const MEETUP_GROUP_URL = "https://www.meetup.com/es-es/kleff-bcn/";
const HANAKA_REEL = "https://www.instagram.com/p/DXbPL40jG8p/";

type BadgeKind = "weekly" | "monthly" | "yearly" | "occasional" | "frequent" | "custom";

function Badge({ kind, label, id }: { kind: BadgeKind; label: string; id?: string }) {
  const styles: Record<BadgeKind, string> = {
    weekly: "bg-coral text-cream border-ink",
    monthly: "bg-cream border-ink text-ink",
    yearly: "bg-ink text-cream border-ink",
    occasional: "bg-primary-soft border-ink text-ink",
    frequent: "bg-cream-deep border-ink text-ink",
    custom: "bg-coral-deep text-cream border-ink",
  };
  const className = `inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 ${styles[kind]}`;
  if (id) {
    return (
      <EditableText id={id} as="span" className={className}>
        {label}
      </EditableText>
    );
  }
  return <span className={className}>{label}</span>;
}

export function ActivitiesPage() {
  const { t, locale } = useI18n();
  const a = t.activities;

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
    { title: "Blood on the Clocktower", icon: <Sparkles className="h-5 w-5" />, href: clocktowerHref },
    { title: "Catan", icon: <Dice5 className="h-5 w-5" />, href: catanHref },
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
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-10 right-[8%] size-72 rounded-full bg-coral/20 blur-3xl" />
          <div className="absolute bottom-0 left-[10%] size-80 rounded-full bg-coral-deep/15 blur-3xl" />
          <div className="absolute top-24 left-[6%] text-7xl rotate-[-12deg] opacity-80 select-none">🎲</div>
          <div className="absolute top-12 right-[18%] text-6xl rotate-[14deg] opacity-80 select-none">🃏</div>
          <div className="absolute bottom-16 right-[10%] text-7xl rotate-[8deg] opacity-80 select-none">🏆</div>
          <div className="absolute bottom-24 left-[22%] text-5xl rotate-[-6deg] opacity-75 select-none">♟️</div>
          <div className="absolute top-1/2 right-[42%] text-4xl rotate-[20deg] opacity-60 select-none">✨</div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-20 md:pb-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/15 border-2 border-coral/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
            <Sparkles className="h-3.5 w-3.5" />
            <EditableText id="activities.hero.eyebrow" as="span">{a.eyebrow}</EditableText>
          </span>
          <EditableText
            id="activities.hero.title"
            as="h1"
            className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-semibold leading-[0.95] tracking-tight"
          >
            {a.title}
          </EditableText>
          <EditableText
            id="activities.hero.intro"
            as="p"
            className="mt-6 text-lg sm:text-xl text-foreground/75 leading-relaxed max-w-2xl mx-auto"
          >
            {a.intro}
          </EditableText>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={MEETUP_EVENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <CalendarDays className="h-5 w-5" />
              <EditableText id="activities.hero.ctaMeetup" as="span">{a.ctaMeetup}</EditableText>
            </a>
          </div>
        </div>
      </section>

      {/* MAIN: GAME NIGHT */}
      <section id="noche-de-juegos" className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-coral text-cream border-2 border-ink px-3 py-1 text-[11px] font-bold uppercase tracking-widest shadow-tactile-sm">
                <Calendar className="h-3.5 w-3.5" />{" "}
                <EditableText id="activities.main.eyebrow" as="span">{a.mainEyebrow}</EditableText>
              </span>
              <EditableText
                id="activities.main.title"
                as="h2"
                className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
              >
                {a.mainTitle}
              </EditableText>
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
              <EditableText id="activities.main.body1" as="p" className="text-lg text-foreground/80 leading-relaxed">
                {a.mainBody1}
              </EditableText>
              <EditableText id="activities.main.body2" as="p" className="text-lg text-foreground/80 leading-relaxed">
                {a.mainBody2}
              </EditableText>
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
                <EditableText id="activities.main.cta" as="span">{a.mainCta}</EditableText>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* INSIDE GAME NIGHT */}
      <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
        <div className="absolute top-1/3 -left-32 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-32 size-80 rounded-full bg-coral-deep/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {locale === "en" ? "Inside Game Night" : locale === "ca" ? "Dins de la Nit" : "Dentro de la Noche"}
            </span>
            <EditableText
              id="activities.inside.title"
              as="h2"
              className="text-4xl sm:text-5xl font-display font-semibold leading-tight"
            >
              {a.insideTitle}
            </EditableText>
            <EditableText
              id="activities.inside.subtitle"
              as="p"
              className="mt-4 text-lg text-foreground/70"
            >
              {a.insideSubtitle}
            </EditableText>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            <Link
              to={tournamentsHref}
              className="group relative md:col-span-7 md:row-span-2 bg-gradient-to-br from-coral via-coral to-coral-deep text-cream border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-tactile-lg hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile transition-all overflow-hidden flex flex-col justify-between min-h-[360px]"
            >
              <div className="absolute -top-10 -right-10 size-56 bg-cream/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-6 right-6 text-[140px] leading-none opacity-30 select-none" aria-hidden>🏆</div>
              <div className="relative">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-cream/40 bg-cream/15 text-cream">
                  {a.badgeMonthly}
                </span>
                <EditableText
                  id="activities.inside.tournamentsTitle"
                  as="h3"
                  className="mt-4 text-3xl sm:text-4xl font-display font-semibold leading-tight max-w-md"
                >
                  {a.inside1Title}
                </EditableText>
                <EditableText
                  id="activities.inside.tournamentsBody"
                  as="p"
                  className="mt-4 text-base sm:text-lg text-cream/90 leading-relaxed max-w-lg"
                >
                  {a.inside1Body}
                </EditableText>
              </div>
              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all">
                {locale === "en" ? "More about tournaments" : locale === "ca" ? "Més sobre tornejos" : "Más sobre torneos"}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <article className="relative md:col-span-5 bg-ink text-cream border-2 border-ink rounded-3xl p-7 shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile-lg transition-all overflow-hidden">
              <div className="absolute -bottom-6 -right-6 text-[110px] leading-none opacity-25 select-none" aria-hidden>📦</div>
              <div className="relative">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 border-cream/30 bg-cream/10 text-cream">
                  {a.badgeMonthly}
                </span>
                <EditableText
                  id="activities.inside.demosTitle"
                  as="h3"
                  className="mt-4 text-2xl font-display font-semibold leading-tight"
                >
                  {a.inside2Title}
                </EditableText>
                <EditableText
                  id="activities.inside.demosBody"
                  as="p"
                  className="mt-3 text-sm text-cream/85 leading-relaxed"
                >
                  {a.inside2Body}
                </EditableText>
              </div>
            </article>

            <article className="relative md:col-span-5 bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-tactile transition-all overflow-hidden">
              <div className="absolute -bottom-6 -right-6 text-[110px] leading-none opacity-20 select-none" aria-hidden>💘</div>
              <div className="relative">
                <Badge kind="occasional" label={a.badgeOccasional} />
                <EditableText
                  id="activities.inside.slowTitle"
                  as="h3"
                  className="mt-3 text-2xl font-display font-semibold leading-tight"
                >
                  {a.inside3Title}
                </EditableText>
                <EditableText
                  id="activities.inside.slowBody"
                  as="p"
                  className="mt-3 text-sm text-foreground/75 leading-relaxed"
                >
                  {a.inside3Body}
                </EditableText>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* SPECIAL GAME NIGHTS */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mb-14">
            <EditableText
              id="activities.special.eyebrow"
              as="span"
              className="inline-block bg-coral text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            >
              {a.specialEyebrow}
            </EditableText>
            <EditableText
              id="activities.special.title"
              as="h2"
              className="text-4xl sm:text-5xl font-display font-semibold leading-tight"
            >
              {a.specialTitle}
            </EditableText>
            <EditableText
              id="activities.special.subtitle"
              as="p"
              className="mt-4 text-lg text-cream/80"
            >
              {a.specialSubtitle}
            </EditableText>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { key: "carnival", emoji: "🎭", title: a.special1Title, body: a.special1Body },
              { key: "halloween", emoji: "🎃", title: a.special2Title, body: a.special2Body },
              { key: "xmas", emoji: "🎄", title: a.special3Title, body: a.special3Body },
            ].map((s) => (
              <article
                key={s.key}
                className="relative bg-cream/5 backdrop-blur border-2 border-cream/20 rounded-3xl p-7 hover:bg-cream/10 transition-colors"
              >
                <div className="text-5xl mb-5" aria-hidden>{s.emoji}</div>
                <Badge kind="yearly" label={a.badgeYearly} />
                <EditableText
                  id={`activities.special.${s.key}.title`}
                  as="h3"
                  className="mt-3 text-2xl font-display font-semibold leading-tight"
                >
                  {s.title}
                </EditableText>
                <EditableText
                  id={`activities.special.${s.key}.body`}
                  as="p"
                  className="mt-3 text-base text-cream/80 leading-relaxed"
                >
                  {s.body}
                </EditableText>
              </article>
            ))}
          </div>
          <EditableText
            id="activities.special.note"
            as="p"
            className="mt-10 max-w-3xl text-sm text-cream/70 italic border-l-2 border-coral pl-4"
          >
            {a.specialNote}
          </EditableText>
        </div>
      </section>

      {/* COLLABORATIONS */}
      <section className="py-20 md:py-28 bg-cream-deep/40 relative overflow-hidden">
        {/* Decorative tape / dots */}
        <div className="absolute top-10 left-10 size-20 bg-coral/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 size-32 bg-ink/5 rounded-full blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center">
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-coral/15 border-2 border-coral/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-coral-deep">
              <Handshake className="h-3.5 w-3.5" />
              <EditableText id="activities.collabs.eyebrow" as="span">{a.frequentEyebrow}</EditableText>
            </span>
            <EditableText
              id="activities.collabs.title"
              as="h2"
              className="mt-5 text-4xl sm:text-5xl font-display font-semibold leading-tight"
            >
              {a.frequentTitle}
            </EditableText>
            <EditableText
              id="activities.collabs.body1"
              as="p"
              className="mt-5 text-lg text-foreground/75 leading-relaxed"
            >
              {a.frequentBody}
            </EditableText>
            <EditableText
              id="activities.collabs.body2"
              as="p"
              className="mt-4 text-lg text-foreground/75 leading-relaxed"
            >
              {a.partnersBody}
            </EditableText>
          </div>
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            {/* Polaroid-style frame around the reel */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-coral/70 rotate-[-2deg] rounded-sm shadow-tactile-sm border border-ink/20 z-10" />
              <div className="bg-cream border-2 border-ink rounded-2xl shadow-tactile-lg p-3 sm:p-4 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-[300px] sm:w-[360px] overflow-hidden rounded-xl">
                  <InstagramEmbed url={HANAKA_REEL} bare />
                </div>
                <div className="mt-3 px-2 pb-1 text-center font-display text-sm text-ink/70 tracking-wide">
                  @kleff.bcn × @kasa_hanaka
                </div>
              </div>
            </div>
          </div>
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
                  <HeartHandshake className="h-3.5 w-3.5" />{" "}
                  <EditableText id="activities.teamBuilding.eyebrow" as="span">{a.teamBuildingEyebrow}</EditableText>
                </span>
                <EditableText
                  id="activities.teamBuilding.title"
                  as="h2"
                  className="mt-4 text-3xl sm:text-4xl font-display font-semibold leading-tight"
                >
                  {a.teamBuildingTitle}
                </EditableText>
                <EditableText
                  id="activities.teamBuilding.body"
                  as="p"
                  className="mt-4 text-cream/90 leading-relaxed"
                >
                  {a.teamBuildingBody}
                </EditableText>
              </div>
              <div className="flex md:justify-end">
                <Link
                  to={contactHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink text-cream border-2 border-ink px-6 py-3 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <EditableText id="activities.teamBuilding.cta" as="span">{a.teamBuildingCta}</EditableText>{" "}
                  <ArrowRight className="h-5 w-5" />
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
          <EditableText
            id="activities.calendar.eyebrow"
            as="span"
            className="block text-xs font-bold uppercase tracking-widest text-coral mb-3"
          >
            {a.calendarEyebrow}
          </EditableText>
          <EditableText
            id="activities.calendar.title"
            as="h2"
            className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold leading-tight"
          >
            {a.calendarTitle}
          </EditableText>
          <EditableText
            id="activities.calendar.body"
            as="p"
            className="mt-5 text-lg text-cream/80 leading-relaxed max-w-2xl mx-auto"
          >
            {a.calendarBody}
          </EditableText>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href={MEETUP_EVENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-coral text-cream border-2 border-cream px-7 py-4 text-lg font-bold shadow-tactile-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
            >
              <CalendarDays className="h-5 w-5" />
              <EditableText id="activities.calendar.cta" as="span">{a.calendarCta}</EditableText>
            </a>
            <a
              href={MEETUP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-transparent text-cream border-2 border-cream/40 px-7 py-4 text-lg font-bold hover:bg-cream/10 transition-all"
            >
              <EditableText id="activities.calendar.group" as="span">{a.calendarGroup}</EditableText>{" "}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
