import { useState } from "react";
import {
  Sparkles,
  Heart,
  Users,
  MapPin,
  Coffee,
  HandHeart,
  Library,
  Zap,
  Tag,
  Star,
  ArrowRight,
  Mail,
  Crown,
  Skull,
  Hexagon,
  Trophy,
  EyeOff,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EditableText } from "@/editor/Editable";
import { useSectionContent } from "@/cms/useSectionContent";
import { or } from "@/cms/or";

type Cadence = "weekly" | "monthly" | "yearly" | "occasional";

function StepCard({
  index,
  title,
  body,
  icon,
}: {
  index: number;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile h-full">
      <span className="absolute -top-4 -left-4 size-12 rounded-full bg-coral text-cream border-2 border-ink shadow-tactile-sm flex items-center justify-center font-display font-bold text-lg">
        {index}
      </span>
      <div className="size-14 rounded-2xl bg-cream-deep border-2 border-ink flex items-center justify-center text-coral-deep">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-display font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-base text-foreground/75 leading-relaxed">{body}</p>
    </div>
  );
}

function ActivityChip({ cadence, label }: { cadence: Cadence; label: string }) {
  const styles: Record<Cadence, string> = {
    weekly: "bg-coral text-cream border-ink",
    monthly: "bg-cream border-ink text-ink",
    yearly: "bg-ink text-cream border-ink",
    occasional: "bg-primary-soft border-ink text-ink",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border-2 ${styles[cadence]}`}
    >
      {label}
    </span>
  );
}

function ActivityCard({
  cadence,
  cadenceLabel,
  title,
  body,
  emoji,
}: {
  cadence: Cadence;
  cadenceLabel: string;
  title: string;
  body: string;
  emoji: string;
}) {
  return (
    <article className="relative bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm hover:shadow-tactile hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all duration-200 flex flex-col h-full">
      <div className="text-4xl leading-none mb-4" aria-hidden>
        {emoji}
      </div>
      <ActivityChip cadence={cadence} label={cadenceLabel} />
      <h3 className="mt-3 text-xl font-display font-semibold leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70 leading-relaxed flex-1">{body}</p>
    </article>
  );
}

function CommunityCard({
  title,
  body,
  tag,
  icon,
  accent,
  href,
  ctaLabel,
}: {
  title: string;
  body: string;
  tag: string;
  icon: React.ReactNode;
  accent: "coral" | "ink";
  href?: string;
  ctaLabel?: string;
}) {
  const isCoral = accent === "coral";
  const inner = (
    <>
      <div
        className={`size-14 rounded-2xl border-2 border-cream/40 flex items-center justify-center mb-5 ${
          isCoral ? "bg-coral-deep" : "bg-cream/10"
        }`}
      >
        {icon}
      </div>
      <h3 className="text-2xl font-display font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed opacity-90">{body}</p>
      <div className="mt-5 flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-cream text-ink border-2 border-cream rounded-full px-3 py-1">
          <Tag className="h-3 w-3" /> {tag}
        </span>
        {href && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest opacity-90 group-hover:opacity-100">
            {ctaLabel ?? "Ver más"} <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </>
  );

  const cls = `group relative overflow-hidden border-2 border-ink rounded-3xl p-7 shadow-tactile transition-all duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] ${
    isCoral ? "bg-coral text-cream" : "bg-ink text-cream"
  } ${href ? "cursor-pointer" : ""}`;

  if (href) {
    return (
      <Link to={href} className={`${cls} block no-underline`}>
        {inner}
      </Link>
    );
  }

  return <article className={cls}>{inner}</article>;
}

function BenefitFlipCard({
  icon,
  title,
  body,
  flipped,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  flipped: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flip-card aspect-[4/3] sm:aspect-square w-full text-left ${
        flipped ? "is-flipped" : ""
      }`}
      aria-pressed={flipped}
    >
      <div className="flip-card-inner rounded-3xl">
        {/* Front */}
        <div className="flip-card-face bg-card border-2 border-ink shadow-tactile flex flex-col items-center justify-center p-6 text-center">
          <div className="size-16 rounded-2xl bg-coral text-cream border-2 border-ink flex items-center justify-center shadow-tactile-sm">
            {icon}
          </div>
          <h3 className="mt-5 text-xl font-display font-semibold leading-tight">{title}</h3>
          <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
            ↻ Tap / Hover
          </span>
        </div>
        {/* Back */}
        <div className="flip-card-face flip-card-back bg-coral text-cream border-2 border-ink shadow-tactile flex flex-col items-center justify-center p-6 text-center">
          <Star className="h-7 w-7 mb-3 fill-cream" />
          <p className="text-base leading-relaxed font-medium">{body}</p>
        </div>
      </div>
    </button>
  );
}

export function HowItWorksPage() {
  const { t, locale } = useI18n();
  const hero = useSectionContent("how.hero");
  const [flipped, setFlipped] = useState<number | null>(null);

  const toggle = (i: number) => setFlipped((cur) => (cur === i ? null : i));

  const activities: {
    cadence: Cadence;
    title: string;
    body: string;
    emoji: string;
  }[] = [
    {
      cadence: "weekly",
      title: t.how.activityWeekly1Title,
      body: t.how.activityWeekly1Body,
      emoji: "🎲",
    },
    {
      cadence: "monthly",
      title: t.how.activityMonthly1Title,
      body: t.how.activityMonthly1Body,
      emoji: "🏆",
    },
    {
      cadence: "monthly",
      title: t.how.activityMonthly2Title,
      body: t.how.activityMonthly2Body,
      emoji: "📦",
    },
    {
      cadence: "occasional",
      title: t.how.activityOccasional1Title,
      body: t.how.activityOccasional1Body,
      emoji: "💘",
    },
    {
      cadence: "yearly",
      title: t.how.activityYearly1Title,
      body: t.how.activityYearly1Body,
      emoji: "🎭",
    },
    {
      cadence: "yearly",
      title: t.how.activityYearly2Title,
      body: t.how.activityYearly2Body,
      emoji: "🎃",
    },
    {
      cadence: "yearly",
      title: t.how.activityYearly3Title,
      body: t.how.activityYearly3Body,
      emoji: "🎄",
    },
  ];

  const cadenceLabel = (c: Cadence) =>
    c === "weekly"
      ? t.how.weekly
      : c === "monthly"
        ? t.how.monthly
        : c === "yearly"
          ? t.how.yearly
          : t.how.occasional;

  const benefits = [
    { icon: <Library className="h-7 w-7" />, title: t.how.benefit1Title, body: t.how.benefit1Body },
    { icon: <Zap className="h-7 w-7" />, title: t.how.benefit2Title, body: t.how.benefit2Body },
    { icon: <Tag className="h-7 w-7" />, title: t.how.benefit3Title, body: t.how.benefit3Body },
    { icon: <Heart className="h-7 w-7" />, title: t.how.benefit4Title, body: t.how.benefit4Body },
  ];

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
            <Sparkles className="h-3.5 w-3.5" />
            <EditableText id="how.hero.eyebrow" as="span">{or(hero.eyebrow, t.how.eyebrow)}</EditableText>
          </span>
          <EditableText id="how.hero.title" as="h1" className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[0.98] tracking-tight">
            {or(hero.title, t.how.title)}
          </EditableText>
          <EditableText id="how.hero.intro" as="p" className="mt-7 text-lg sm:text-xl text-foreground/75 max-w-3xl mx-auto leading-relaxed">
            {or(hero.intro, t.how.intro)}
          </EditableText>

          {/* Non-profit + consumption stickers */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 bg-card border-2 border-ink rounded-2xl px-4 py-2.5 shadow-tactile-sm">
              <HandHeart className="h-5 w-5 text-coral" />
              <span className="text-sm font-bold">{t.how.nonProfitTitle}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-coral text-cream border-2 border-ink rounded-2xl px-4 py-2.5 shadow-tactile-sm">
              <Coffee className="h-5 w-5" />
              <span className="text-sm font-bold">{t.how.consumptionBadge}</span>
            </div>
            <Link
              to={locale === "en" ? "/en/ludoteca" : locale === "ca" ? "/ca/ludoteca" : "/ludoteca"}
              className="inline-flex items-center gap-2 bg-ink text-cream border-2 border-ink rounded-2xl px-4 py-2.5 shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <Library className="h-5 w-5" />
              <span className="text-sm font-bold">
                {locale === "en"
                  ? "Discover our library"
                  : locale === "ca"
                    ? "Coneix la nostra ludoteca"
                    : "Conoce nuestra ludoteca"}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 steps */}
      <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {locale === "en" ? "Step by step" : locale === "ca" ? "Pas a pas" : "Paso a paso"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              {t.how.howItWorksTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">{t.how.howItWorksBody}</p>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-10 md:gap-8">
            <StepCard
              index={1}
              title={t.how.step1Title}
              body={t.how.step1Body}
              icon={<MapPin className="h-7 w-7" />}
            />
            <StepCard
              index={2}
              title={t.how.step2Title}
              body={t.how.step2Body}
              icon={<Users className="h-7 w-7" />}
            />
            <StepCard
              index={3}
              title={t.how.step3Title}
              body={t.how.step3Body}
              icon={<Heart className="h-7 w-7" />}
            />
          </div>
        </div>
      </section>

      {/* ACTIVITIES */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
              {locale === "en" ? "Activities" : locale === "ca" ? "Activitats" : "Actividades"}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              {t.how.activitiesTitle}
            </h2>
            <p className="mt-4 text-lg text-foreground/70">{t.how.activitiesSubtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activities.map((a, i) => (
              <ActivityCard
                key={i}
                cadence={a.cadence}
                cadenceLabel={cadenceLabel(a.cadence)}
                title={a.title}
                body={a.body}
                emoji={a.emoji}
              />
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITIES */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mb-14">
            <span className="inline-block bg-coral text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {t.how.communitiesEyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              {t.how.communitiesTitle}
            </h2>
            <p className="mt-4 text-lg text-cream/75">{t.how.communitiesIntro}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CommunityCard
              title={t.how.community1Title}
              body={t.how.community1Body}
              tag={t.how.community1Tag}
              icon={<Skull className="h-7 w-7 text-cream" />}
              accent="coral"
              href="/clocktower"
              ctaLabel="Ver página"
            />
            <CommunityCard
              title={t.how.community2Title}
              body={t.how.community2Body}
              tag={t.how.community2Tag}
              icon={<Hexagon className="h-7 w-7 text-cream" />}
              accent="ink"
              href={locale === "en" ? "/en/catan" : locale === "ca" ? "/ca/catan" : "/catan"}
              ctaLabel={locale === "en" ? "View page" : locale === "ca" ? "Veure pàgina" : "Ver página"}
            />
            <CommunityCard
              title={t.how.community3Title}
              body={t.how.community3Body}
              tag={t.how.community3Tag}
              icon={<Trophy className="h-7 w-7 text-cream" />}
              accent="coral"
              href={locale === "en" ? "/en/tournaments" : locale === "ca" ? "/ca/tornejos" : "/torneos"}
              ctaLabel={locale === "en" ? "View page" : locale === "ca" ? "Veure pàgina" : "Ver página"}
            />
            <CommunityCard
              title={t.how.community4Title}
              body={t.how.community4Body}
              tag={t.how.community4Tag}
              icon={<EyeOff className="h-7 w-7 text-cream" />}
              accent="ink"
              href={locale === "en" ? "/en/hidden-roles" : locale === "ca" ? "/ca/rols-ocults" : "/roles-ocultos"}
              ctaLabel={locale === "en" ? "View page" : locale === "ca" ? "Veure pàgina" : "Ver página"}
            />
          </div>
        </div>
      </section>

      {/* MEMBERSHIP — interactive flip cards */}
      <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
        {/* Decorative coral square */}
        <div
          className="hidden md:block absolute -right-20 top-20 size-72 bg-coral/10 rounded-3xl rotate-6 pointer-events-none"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl text-center mx-auto">
            <span className="inline-flex items-center gap-2 bg-coral text-cream border-2 border-ink rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tactile-sm">
              <Crown className="h-3.5 w-3.5" /> {t.how.memberEyebrow}
            </span>
            <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              {t.how.memberTitle}
            </h2>
            <p className="mt-5 text-lg text-foreground/75">{t.how.memberSubtitle}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-coral-deep">
              ↻ {t.how.memberFlipHint}
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <BenefitFlipCard
                key={i}
                icon={b.icon}
                title={b.title}
                body={b.body}
                flipped={flipped === i}
                onClick={() => toggle(i)}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 max-w-3xl mx-auto bg-ink text-cream border-2 border-ink rounded-3xl p-8 sm:p-10 shadow-tactile-lg text-center">
            <h3 className="text-2xl sm:text-3xl font-display font-semibold leading-tight">
              {t.how.memberCtaTitle}
            </h3>
            <p className="mt-4 text-cream/80 leading-relaxed">{t.how.memberCtaBody}</p>
            <a
              href="mailto:hola@kleff.es?subject=Quiero%20hacerme%20socio%20de%20KLEFF"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-coral text-cream border-2 border-cream px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all"
            >
              <Mail className="h-5 w-5" />
              {t.how.memberCta}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
