import { useMemo } from "react";
import {
  Clock,
  ExternalLink,
  Globe2,
  ImageOff,
  Languages,
  MapPin,
  MessageCircle,
  Skull,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSectionContent } from "@/cms/useSectionContent";
import { useI18n } from "@/i18n/I18nProvider";
import clocktowerLogo from "@/assets/clocktower-logo.png";
import clocktowerHero from "@/assets/clocktower-hero.jpg";

/** Convert any Instagram reel URL to its `/embed` equivalent. */
function reelToEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("instagram.com")) return null;
    // Strip query and trailing slash, then append /embed
    const clean = u.pathname.replace(/\/+$/, "");
    return `https://www.instagram.com${clean}/embed`;
  } catch {
    return null;
  }
}

/** Render textarea content as one paragraph per blank-line block. */
function Paragraphs({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(
    () =>
      text
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean),
    [text]
  );
  return (
    <>
      {blocks.map((b, i) => (
        <p key={i} className={className}>
          {b}
        </p>
      ))}
    </>
  );
}

type LocationItem = {
  name: string;
  frequency?: string;
  tables?: string;
  languages?: string;
  levels?: string;
  description?: string;
  image1?: string;
  image2?: string;
  image3?: string;
};

export function ClocktowerPage() {
  const { locale, href } = useI18n();

  const hero = useSectionContent<{
    eyebrow: string;
    title: string;
    subtitle: string;
    whatsappLabel: string;
    whatsappUrl: string;
    heroImage: string;
  }>("clocktower.hero");

  const about = useSectionContent<{
    eyebrow: string;
    title: string;
    body: string;
    officialLabel: string;
    officialUrl: string;
  }>("clocktower.about");

  const reel = useSectionContent<{
    eyebrow: string;
    title: string;
    subtitle: string;
    reelUrl: string;
  }>("clocktower.reel");

  const locations = useSectionContent<{
    eyebrow: string;
    title: string;
    intro: string;
    items: LocationItem[];
  }>("clocktower.locations");

  const cta = useSectionContent<{
    eyebrow: string;
    title: string;
    subtitle: string;
    whatsappLabel: string;
    whatsappUrl: string;
  }>("clocktower.cta");

  const heroImg = hero.heroImage || clocktowerHero;
  const embedUrl = reelToEmbed(reel.reelUrl);

  const backLabel =
    locale === "en"
      ? "← Back to How it works"
      : locale === "ca"
        ? "← Tornar a Com funciona"
        : "← Volver a Cómo funciona";

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-ink text-cream overflow-hidden border-b-2 border-ink/20">
        <div className="absolute inset-0 opacity-30">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            width={1600}
            height={1200}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />
        </div>

        {/* Decorative accents */}
        <div className="pointer-events-none absolute -top-12 -left-12 size-64 bg-coral/15 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-16 right-10 size-72 bg-coral/10 blur-3xl rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Link
              to={href("/how-it-works")}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cream/60 hover:text-coral mb-5"
            >
              {backLabel}
            </Link>
            <span className="inline-flex items-center gap-2 bg-coral text-cream border-2 border-cream/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-6">
              <Skull className="h-3.5 w-3.5" />
              {hero.eyebrow}
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              {hero.title}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-cream/80 max-w-2xl leading-relaxed">
              {hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={hero.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-cream/20 px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                {hero.whatsappLabel}
              </a>
              <a
                href={about.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-cream/30 px-6 py-3.5 text-sm font-bold text-cream hover:bg-cream/10 transition-colors"
              >
                {about.officialLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Stat icon={<Users className="h-4 w-4 text-coral" />} label={locale === "en" ? "5–20 players" : locale === "ca" ? "5–20 jugadors" : "5–20 jugadores"} />
              <Stat icon={<Clock className="h-4 w-4 text-coral" />} label={locale === "en" ? "60–120 min" : "60–120 min"} />
              <Stat icon={<Sparkles className="h-4 w-4 text-coral" />} label={locale === "en" ? "Social deduction" : locale === "ca" ? "Deducció social" : "Deducción social"} />
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <div className="relative max-w-[420px] w-full">
              <div className="absolute inset-0 bg-coral/30 blur-2xl rounded-full scale-90" aria-hidden />
              <img
                src={clocktowerLogo}
                alt="Blood on the Clocktower"
                width={1024}
                height={1024}
                className="relative w-full h-auto drop-shadow-[0_10px_40px_rgba(255,107,91,0.25)]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT THE GAME */}
      <section className="py-20 md:py-28 bg-cream border-b-2 border-ink/10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <span className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-5">
            {about.eyebrow}
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-[1.05] max-w-4xl">
            {about.title}
          </h2>
          <div className="mt-8 space-y-5 text-lg text-foreground/80 leading-relaxed max-w-3xl">
            <Paragraphs text={about.body} />
          </div>

          <a
            href={about.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-coral-deep hover:text-coral underline-offset-4 hover:underline"
          >
            {about.officialLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* INSTAGRAM REEL */}
      {embedUrl && (
        <section className="py-20 md:py-24 bg-cream-deep/40 border-b-2 border-ink/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
                {reel.eyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground leading-tight">
                {reel.title}
              </h2>
              <p className="mt-4 text-lg text-foreground/70 max-w-lg">{reel.subtitle}</p>
              <a
                href={reel.reelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-coral-deep hover:text-coral underline-offset-4 hover:underline"
              >
                {locale === "en" ? "Open on Instagram" : locale === "ca" ? "Obrir a Instagram" : "Abrir en Instagram"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="flex justify-center">
              <div className="bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden w-full max-w-[420px]">
                <div className="relative" style={{ aspectRatio: "9 / 16" }}>
                  <iframe
                    src={embedUrl}
                    title="Reel de Instagram — Blood on the Clocktower"
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    scrolling="no"
                    frameBorder={0}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LOCATIONS */}
      <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="inline-block bg-coral text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {locations.eyebrow}
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              {locations.title}
            </h2>
            <p className="mt-4 text-lg text-cream/75">{locations.intro}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {locations.items.map((loc, i) => (
              <LocationCard key={`${loc.name}-${i}`} location={loc} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — WHATSAPP */}
      <section className="py-20 md:py-24 bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative bg-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 bg-coral/15 rounded-full blur-2xl pointer-events-none" />
            <MessageCircle className="h-10 w-10 text-coral mx-auto" />
            <span className="mt-3 inline-block stamp-ink text-[10px] font-bold uppercase tracking-widest">
              {cta.eyebrow}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground">
              {cta.title}
            </h2>
            <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto">{cta.subtitle}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={cta.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                {cta.whatsappLabel}
              </a>
              <Link
                to={href("/how-it-works")}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-6 py-3.5 text-sm font-bold hover:bg-foreground transition-colors"
              >
                {locale === "en" ? "Other communities" : locale === "ca" ? "Altres comunitats" : "Otras comunidades"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

/* ---------------- Subcomponents ---------------- */

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-cream/10 border border-cream/20 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cream/85">
      {icon}
      {label}
    </span>
  );
}

function LocationCard({ location, index }: { location: LocationItem; index: number }) {
  const accent = index % 2 === 0 ? "coral" : "ink";
  const isCoral = accent === "coral";
  const images = [location.image1, location.image2, location.image3].filter(
    (s): s is string => !!s && s.length > 0
  );

  return (
    <article className="bg-cream text-foreground border-4 border-cream rounded-3xl overflow-hidden shadow-tactile-lg flex flex-col">
      {/* Header strip */}
      <div
        className={`px-6 py-5 border-b-2 border-ink/10 ${
          isCoral ? "bg-coral text-cream" : "bg-ink text-cream"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
              <MapPin className="h-3 w-3" />
              {location.frequency || "—"}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
              {location.name}
            </h3>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <Gallery images={images} />

      {/* Meta */}
      <div className="p-6 grid sm:grid-cols-3 gap-3">
        {location.tables && (
          <Meta icon={<Users className="h-4 w-4 text-coral" />} label={location.tables} />
        )}
        {location.languages && (
          <Meta icon={<Languages className="h-4 w-4 text-coral" />} label={location.languages} />
        )}
        {location.levels && (
          <Meta icon={<Trophy className="h-4 w-4 text-coral" />} label={location.levels} />
        )}
      </div>

      {location.description && (
        <p className="px-6 pb-6 text-foreground/75 leading-relaxed">{location.description}</p>
      )}
    </article>
  );
}

function Meta({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-foreground/80">
      <div className="mt-0.5">{icon}</div>
      <span className="leading-snug">{label}</span>
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="bg-cream-deep/40 border-b-2 border-ink/10 flex items-center justify-center py-10 text-foreground/40 text-sm">
        <ImageOff className="h-4 w-4 mr-2" />
        Sin imágenes todavía
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="aspect-[16/9] bg-cream-deep/40 overflow-hidden border-b-2 border-ink/10">
        <img
          src={images[0]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // 2 or 3 images: feature first, the rest stacked
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-1 aspect-[16/9] bg-cream-deep/40 border-b-2 border-ink/10">
      <div className="col-span-2 row-span-2 overflow-hidden">
        <img src={images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="overflow-hidden">
        <img src={images[1]} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      {images[2] ? (
        <div className="overflow-hidden">
          <img src={images[2]} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="bg-cream-deep/60 flex items-center justify-center text-foreground/30">
          <Globe2 className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
