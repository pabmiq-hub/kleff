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
import { SectionProvider, useSectionValue } from "@/cms/SectionContext";
import { CmsImage, CmsList, CmsText } from "@/cms/Editable";
import { useEditor } from "@/editor/EditorProvider";
import { useI18n } from "@/i18n/I18nProvider";
import clocktowerLogo from "@/assets/clocktower-logo.webp";
import clocktowerHero from "@/assets/clocktower-hero.webp";
import { OptimizedImg } from "@/components/ui/optimized-img";

/** Convert any Instagram reel URL to its `/embed` equivalent. */
function reelToEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.includes("instagram.com")) return null;
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

export function ClocktowerPage() {
  return (
    <SiteLayout>
      <SectionProvider sectionKey="clocktower.hero">
        <HeroSection />
      </SectionProvider>

      <SectionProvider sectionKey="clocktower.about">
        <AboutSection />
      </SectionProvider>

      <SectionProvider sectionKey="clocktower.reel">
        <ReelSection />
      </SectionProvider>

      <SectionProvider sectionKey="clocktower.locations">
        <LocationsSection />
      </SectionProvider>

      <SectionProvider sectionKey="clocktower.cta">
        <CtaSection />
      </SectionProvider>
    </SiteLayout>
  );
}

/* -------------------- HERO -------------------- */

function HeroSection() {
  const { locale } = useI18n();
  const heroImage = useSectionValue<string>("heroImage", "");
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  const heroImg = heroImage || clocktowerHero;

  return (
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

      <div className="pointer-events-none absolute -top-12 -left-12 size-64 bg-coral/15 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-16 right-10 size-72 bg-coral/10 blur-3xl rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 order-2 lg:order-1">
          <CmsText
            field="title"
            as="h1"
            className="font-display font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-6 text-lg sm:text-xl text-cream/80 max-w-2xl leading-relaxed"
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-cream/20 px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <CmsText field="whatsappLabel" as="span" />
            </a>
            <span className="inline-flex items-center gap-2 bg-coral text-cream border-2 border-cream/20 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest">
              <Skull className="h-3.5 w-3.5" />
              <CmsText field="eyebrow" as="span" />
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Stat
              icon={<Users className="h-4 w-4 text-coral" />}
              label={locale === "en" ? "5–20 players" : locale === "ca" ? "5–20 jugadors" : "5–20 jugadores"}
            />
            <Stat icon={<Clock className="h-4 w-4 text-coral" />} label="60–120 min" />
            <Stat
              icon={<Sparkles className="h-4 w-4 text-coral" />}
              label={locale === "en" ? "Social deduction" : locale === "ca" ? "Deducció social" : "Deducción social"}
            />
          </div>

          <HeroImageEditor />
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
  );
}

/** Small editor-only block to manage the hero background image, since the
 * actual hero image is rendered as a CSS background and can't be clicked. */
function HeroImageEditor() {
  const { editMode } = useEditor();
  if (!editMode) return null;
  return (
    <div className="mt-8 p-4 rounded-2xl border-2 border-dashed border-cream/30 bg-ink/40 max-w-md">
      <div className="text-xs font-bold uppercase tracking-widest text-cream/70 mb-2">
        Imagen de fondo del hero
      </div>
      <CmsImage
        field="heroImage"
        alt=""
        className="w-full h-32 object-cover rounded-lg"
        emptyLabel="Subir imagen de fondo"
      />
    </div>
  );
}

/* -------------------- ABOUT -------------------- */

function AboutSection() {
  const officialUrl = useSectionValue<string>("officialUrl", "");
  const body = useSectionValue<string>("body", "");
  return (
    <section className="py-20 md:py-28 bg-cream border-b-2 border-ink/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <CmsText
          field="eyebrow"
          as="span"
          className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-5"
        />
        <CmsText
          field="title"
          as="h2"
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-foreground leading-[1.05] max-w-4xl"
        />
        <div className="mt-8 space-y-5 text-lg text-foreground/80 leading-relaxed max-w-3xl">
          <Paragraphs text={body} />
          <BodyEditor />
        </div>

        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-coral-deep hover:text-coral underline-offset-4 hover:underline"
        >
          <CmsText field="officialLabel" as="span" />
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

/** Edit-mode-only textarea for the long body, since plain Paragraphs is read-only. */
function BodyEditor() {
  const { editMode } = useEditor();
  if (!editMode) return null;
  return (
    <div className="mt-4 p-4 rounded-2xl border-2 border-dashed border-coral/40 bg-cream-deep/30">
      <div className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
        Texto largo (separa párrafos con una línea en blanco)
      </div>
      <CmsText
        field="body"
        multiline
        as="div"
        className="text-base text-foreground/85 whitespace-pre-wrap min-h-[8rem]"
      />
    </div>
  );
}

/* -------------------- REEL -------------------- */

function ReelSection() {
  const { locale } = useI18n();
  const reelUrl = useSectionValue<string>("reelUrl", "");
  const embedUrl = reelToEmbed(reelUrl);
  if (!embedUrl) return null;
  return (
    <section className="py-20 md:py-24 bg-cream-deep/40 border-b-2 border-ink/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground leading-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-foreground/70 max-w-lg"
          />
          <a
            href={reelUrl}
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
  );
}

/* -------------------- LOCATIONS -------------------- */

function LocationsSection() {
  return (
    <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
      <div className="absolute -top-16 -right-16 size-80 rounded-full bg-coral/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block bg-coral text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
          />
          <CmsText
            field="intro"
            multiline
            as="p"
            className="mt-4 text-lg text-cream/75"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <CmsList
            field="items"
            addLabel="Añadir localización"
            renderItem={({ index, prefix }) => (
              <LocationCard key={index} prefix={prefix} index={index} />
            )}
          />
        </div>
      </div>
    </section>
  );
}

function LocationCard({ prefix, index }: { prefix: string; index: number }) {
  const accent = index % 2 === 0 ? "coral" : "ink";
  const isCoral = accent === "coral";
  const image1 = useSectionValue<string>(`${prefix}.image1`, "");
  const image2 = useSectionValue<string>(`${prefix}.image2`, "");
  const image3 = useSectionValue<string>(`${prefix}.image3`, "");
  const tables = useSectionValue<string>(`${prefix}.tables`, "");
  const languages = useSectionValue<string>(`${prefix}.languages`, "");
  const levels = useSectionValue<string>(`${prefix}.levels`, "");
  const description = useSectionValue<string>(`${prefix}.description`, "");
  const { editMode } = useEditor();

  return (
    <article className="bg-cream text-foreground border-4 border-cream rounded-3xl overflow-hidden shadow-tactile-lg flex flex-col">
      <div
        className={`px-6 py-5 border-b-2 border-ink/10 ${
          isCoral ? "bg-coral text-cream" : "bg-ink text-cream"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
              <MapPin className="h-3 w-3" />
              <CmsText field={`${prefix}.frequency`} as="span" placeholder="Frecuencia" />
            </span>
            <CmsText
              field={`${prefix}.name`}
              as="h3"
              className="font-display text-2xl sm:text-3xl font-semibold leading-tight"
            />
          </div>
        </div>
      </div>

      {/* Gallery (read-mode preview) */}
      {!editMode && <Gallery images={[image1, image2, image3].filter(Boolean) as string[]} />}

      {/* Editor: 3 image slots side-by-side, each clickable */}
      {editMode && (
        <div className="grid grid-cols-3 gap-1 bg-cream-deep/40 border-b-2 border-ink/10">
          <CmsImage
            field={`${prefix}.image1`}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            emptyLabel="Imagen 1"
          />
          <CmsImage
            field={`${prefix}.image2`}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            emptyLabel="Imagen 2"
          />
          <CmsImage
            field={`${prefix}.image3`}
            alt=""
            className="aspect-[4/3] w-full object-cover"
            emptyLabel="Imagen 3"
          />
        </div>
      )}

      <div className="p-6 grid sm:grid-cols-3 gap-3">
        {(tables || editMode) && (
          <Meta
            icon={<Users className="h-4 w-4 text-coral" />}
            field={`${prefix}.tables`}
            placeholder="Mesas / formato"
          />
        )}
        {(languages || editMode) && (
          <Meta
            icon={<Languages className="h-4 w-4 text-coral" />}
            field={`${prefix}.languages`}
            placeholder="Idiomas"
          />
        )}
        {(levels || editMode) && (
          <Meta
            icon={<Trophy className="h-4 w-4 text-coral" />}
            field={`${prefix}.levels`}
            placeholder="Niveles"
          />
        )}
      </div>

      {(description || editMode) && (
        <div className="px-6 pb-6">
          <CmsText
            field={`${prefix}.description`}
            multiline
            as="p"
            className="text-foreground/75 leading-relaxed"
            placeholder="Descripción opcional"
          />
        </div>
      )}
    </article>
  );
}

/* -------------------- CTA -------------------- */

function CtaSection() {
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  return (
    <section className="py-20 md:py-24 bg-cream">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative bg-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 bg-coral/15 rounded-full blur-2xl pointer-events-none" />
          <MessageCircle className="h-10 w-10 text-coral mx-auto" />
          <CmsText
            field="eyebrow"
            as="span"
            className="mt-3 inline-block stamp-ink text-[10px] font-bold uppercase tracking-widest"
          />
          <CmsText
            field="title"
            as="h2"
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <CmsText field="whatsappLabel" as="span" />
            </a>
          </div>
        </div>
      </div>
    </section>
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

function Meta({
  icon,
  field,
  placeholder,
}: {
  icon: React.ReactNode;
  field: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-foreground/80">
      <div className="mt-0.5">{icon}</div>
      <CmsText field={field} as="span" className="leading-snug" placeholder={placeholder} />
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
        <OptimizedImg
          src={images[0]}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-1 aspect-[16/9] bg-cream-deep/40 border-b-2 border-ink/10">
      <div className="col-span-2 row-span-2 overflow-hidden">
        <OptimizedImg src={images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="overflow-hidden">
        <OptimizedImg src={images[1]} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
      {images[2] ? (
        <div className="overflow-hidden">
          <OptimizedImg src={images[2]} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="bg-cream-deep/60 flex items-center justify-center text-foreground/30">
          <Globe2 className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
