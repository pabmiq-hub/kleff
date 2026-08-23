import {
  Calendar,
  ExternalLink,
  Hexagon,
  MessageCircle,
  Sparkles,
  Trees,
  Wheat,
  Mountain,
  Layers,
  Users,
  Trophy,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionProvider, useSectionValue } from "@/cms/SectionContext";
import { CmsImage, CmsList, CmsText } from "@/cms/Editable";
import { useEditor } from "@/editor/EditorProvider";
import catanLogo from "@/assets/catan-logo.webp";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

const RESOURCE_ICONS = [
  { icon: Trees, label: "Madera", color: "bg-emerald-700" },
  { icon: Mountain, label: "Piedra", color: "bg-stone-500" },
  { icon: Wheat, label: "Trigo", color: "bg-amber-500" },
  { icon: Layers, label: "Arcilla", color: "bg-orange-700" },
  { icon: Sparkles, label: "Lana", color: "bg-lime-400" },
];

export function CatanPage() {
  return (
    <SiteLayout>
      <SectionProvider sectionKey="catan.hero">
        <HeroSection />
      </SectionProvider>

      <SectionProvider sectionKey="catan.history">
        <HistorySection />
      </SectionProvider>

      <SectionProvider sectionKey="catan.infographic">
        <InfographicSection />
      </SectionProvider>

      <SectionProvider sectionKey="catan.tournaments">
        <TournamentsSection />
      </SectionProvider>

      <SectionProvider sectionKey="catan.cta">
        <CtaSection />
      </SectionProvider>
    </SiteLayout>
  );
}

/* -------------------- HERO -------------------- */

function HeroSection() {
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-cream to-orange-100 border-b-2 border-ink/15">
      {/* Hex pattern bg */}
      <HexBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 bg-amber-500 text-ink border-2 border-ink rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tactile-sm">
            <Hexagon className="h-3.5 w-3.5" />
            <CmsText field="eyebrow" as="span" />
          </span>
          <CmsText
            field="title"
            as="h1"
            className="mt-6 font-display font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-ink"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-6 text-lg sm:text-xl text-foreground/80 max-w-2xl leading-relaxed"
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <CmsText field="whatsappLabel" as="span" />
            </a>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <Stat icon={<Users className="h-5 w-5 text-amber-600" />} value="250+" labelField="stat1Label" />
            <Stat icon={<Trophy className="h-5 w-5 text-amber-600" />} value="12" labelField="stat2Label" />
            <Stat icon={<Calendar className="h-5 w-5 text-amber-600" />} value="∞" labelField="stat3Label" />
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
          <div className="relative max-w-[420px] w-full">
            <div className="absolute inset-0 bg-amber-300/40 blur-2xl rounded-full scale-90" aria-hidden />
            <img
              src={getOptimizedImageUrl(catanLogo, { width: 1200, height: 1000 })}
              alt="Catan"
              width={900}
              height={500}
              className="relative w-full h-auto drop-shadow-[0_10px_40px_rgba(217,119,6,0.35)]"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HexBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1.4)">
            <polygon
              points="30,2 56,17 56,47 30,62 4,47 4,17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex)" className="text-ink" />
      </svg>
    </div>
  );
}

function Stat({
  icon,
  value,
  labelField,
}: {
  icon: React.ReactNode;
  value: string;
  labelField: string;
}) {
  return (
    <div className="bg-card border-2 border-ink rounded-2xl p-3 shadow-tactile-sm text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="font-display text-2xl font-bold leading-none">{value}</div>
      <CmsText
        field={labelField}
        as="div"
        className="mt-1 text-[10px] font-bold uppercase tracking-widest text-foreground/60"
      />
    </div>
  );
}

/* -------------------- HISTORY -------------------- */

function HistorySection() {
  return (
    <section className="py-20 md:py-28 bg-cream border-b-2 border-ink/10 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 size-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <CmsText
          field="eyebrow"
          as="span"
          className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-5"
        />
        <CmsText
          field="title"
          as="h2"
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-[1.05] max-w-3xl"
        />

        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <CmsList
            field="items"
            addLabel="Añadir hito histórico"
            renderItem={({ index, prefix }) => (
              <article
                key={index}
                className="bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile-sm relative"
              >
                <span className="absolute -top-4 -left-4 size-12 rounded-full bg-amber-500 text-ink border-2 border-ink shadow-tactile-sm flex items-center justify-center font-display font-bold">
                  <CmsText field={`${prefix}.year`} as="span" placeholder="Año" />
                </span>
                <CmsText
                  field={`${prefix}.title`}
                  as="h3"
                  className="text-2xl font-display font-semibold leading-tight mt-2"
                  placeholder="Título del hito"
                />
                <CmsText
                  field={`${prefix}.body`}
                  multiline
                  as="p"
                  className="mt-3 text-base text-foreground/75 leading-relaxed"
                  placeholder="Descripción"
                />
              </article>
            )}
          />
        </div>

        <div className="mt-10">
          <SourceLink />
        </div>
      </div>
    </section>
  );
}

function SourceLink() {
  const url = useSectionValue<string>("sourceUrl", "");
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-bold text-coral-deep hover:text-coral underline-offset-4 hover:underline"
    >
      <CmsText field="sourceLabel" as="span" />
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

/* -------------------- INFOGRAPHIC -------------------- */

function InfographicSection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-amber-50 to-orange-50 relative overflow-hidden">
      <HexBackdrop />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight text-ink"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-foreground/75"
          />
        </div>

        {/* Resources visual */}
        <div className="bg-card border-2 border-ink rounded-3xl p-8 shadow-tactile mb-10">
          <h3 className="font-display text-2xl font-semibold mb-6 text-center">
            <CmsText field="resourcesTitle" as="span" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {RESOURCE_ICONS.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="text-center group">
                  <div
                    className={`mx-auto size-20 ${r.color} rounded-2xl border-2 border-ink shadow-tactile-sm flex items-center justify-center text-white group-hover:-translate-y-1 transition-transform`}
                  >
                    <Icon className="h-10 w-10" strokeWidth={2} />
                  </div>
                  <CmsText
                    field={`resource${i + 1}Label`}
                    as="div"
                    className="mt-3 font-bold text-sm uppercase tracking-wide"
                  />
                  <CmsText
                    field={`resource${i + 1}Use`}
                    as="div"
                    className="mt-1 text-xs text-foreground/60"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* How to play steps with hex tiles */}
        <div className="grid md:grid-cols-3 gap-6">
          <CmsList
            field="rules"
            addLabel="Añadir regla"
            renderItem={({ index, prefix }) => (
              <article
                key={index}
                className="relative bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm"
              >
                <HexTile number={index + 1} />
                <CmsText
                  field={`${prefix}.title`}
                  as="h4"
                  className="mt-4 text-xl font-display font-semibold leading-tight"
                  placeholder="Concepto"
                />
                <CmsText
                  field={`${prefix}.body`}
                  multiline
                  as="p"
                  className="mt-2 text-sm text-foreground/70 leading-relaxed"
                  placeholder="Explicación"
                />
              </article>
            )}
          />
        </div>
      </div>
    </section>
  );
}

function HexTile({ number }: { number: number }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="56" height="64" viewBox="0 0 56 64" className="drop-shadow-md">
        <polygon
          points="28,2 54,16 54,48 28,62 2,48 2,16"
          fill="hsl(var(--coral, 18 88% 65%))"
          stroke="black"
          strokeWidth="2.5"
        />
      </svg>
      <span className="absolute font-display font-bold text-xl text-cream">{number}</span>
    </div>
  );
}

/* -------------------- TOURNAMENTS -------------------- */

function TournamentsSection() {
  const { editMode } = useEditor();
  return (
    <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
      <div className="absolute -top-16 -right-16 size-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block bg-amber-500 text-ink text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-cream/75"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CmsList
            field="items"
            addLabel="Añadir torneo / actividad"
            renderItem={({ index, prefix }) => (
              <article
                key={index}
                className="bg-cream/5 border-2 border-cream/20 rounded-3xl p-6 shadow-tactile-sm hover:border-amber-500/60 transition-colors flex flex-col"
              >
                <div className="size-12 rounded-2xl bg-amber-500 text-ink border-2 border-ink flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6" />
                </div>
                <CmsText
                  field={`${prefix}.title`}
                  as="h3"
                  className="text-xl font-display font-semibold leading-tight"
                  placeholder="Nombre del torneo"
                />
                <CmsText
                  field={`${prefix}.body`}
                  multiline
                  as="p"
                  className="mt-2 text-sm text-cream/70 leading-relaxed flex-1"
                  placeholder="Descripción"
                />
                <div className="mt-4">
                  <CmsImage
                    field={`${prefix}.image`}
                    alt=""
                    className="w-full aspect-video object-cover rounded-xl border border-cream/15"
                    emptyLabel={editMode ? "Imagen (opcional)" : ""}
                  />
                </div>
              </article>
            )}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------- CTA -------------------- */

function CtaSection() {
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  return (
    <section className="py-20 md:py-24 bg-cream">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg overflow-hidden">
          <HexBackdrop />
          <div className="relative">
            <Hexagon className="h-12 w-12 text-amber-600 mx-auto" />
            <CmsText
              field="title"
              as="h2"
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-ink"
            />
            <CmsText
              field="subtitle"
              multiline
              as="p"
              className="mt-4 text-lg text-foreground/75 max-w-2xl mx-auto"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-ink px-6 py-3.5 text-sm font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <CmsText field="whatsappLabel" as="span" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
