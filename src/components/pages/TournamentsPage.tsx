import {
  Trophy,
  MessageCircle,
  Medal,
  Swords,
  Users,
  Sparkles,
  Calendar,
  Award,
  Target,
  Crown,
  HelpCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionProvider, useSection, useSectionValue } from "@/cms/SectionContext";
import { CmsImage, CmsList, CmsText } from "@/cms/Editable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEditor } from "@/editor/EditorProvider";
import { useI18n } from "@/i18n/I18nProvider";

export function TournamentsPage() {
  return (
    <SiteLayout>
      <SectionProvider sectionKey="tournaments.hero">
        <HeroSection />
      </SectionProvider>

      <SectionProvider sectionKey="tournaments.formats">
        <FormatsSection />
      </SectionProvider>

      <SectionProvider sectionKey="tournaments.prizes">
        <PrizesSection />
      </SectionProvider>

      <SectionProvider sectionKey="tournaments.gallery">
        <GallerySection />
      </SectionProvider>

      <SectionProvider sectionKey="tournaments.faq">
        <FaqSection />
      </SectionProvider>

      <SectionProvider sectionKey="tournaments.cta">
        <CtaSection />
      </SectionProvider>
    </SiteLayout>
  );
}

/* -------------------- HERO -------------------- */

function HeroSection() {
  const { locale } = useI18n();
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  const catanHref =
    locale === "en" ? "/en/catan" : locale === "ca" ? "/ca/catan" : "/catan";
  const catanLinkLabel = useSectionValue<string>(
    "catanLinkLabel",
    locale === "en" ? "View Catan community →" : locale === "ca" ? "Veure comunitat Catan →" : "Ver comunidad Catan →",
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink via-ink to-coral-deep text-cream border-b-2 border-ink/15">
      <ConfettiBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-20 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center gap-2 bg-amber-400 text-ink border-2 border-cream rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-tactile-sm">
            <Trophy className="h-3.5 w-3.5" />
            <CmsText field="eyebrow" as="span" />
          </span>
          <CmsText
            field="title"
            as="h1"
            className="mt-6 font-display font-semibold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-6 text-lg sm:text-xl text-cream/80 max-w-2xl leading-relaxed"
          />

          <div className="mt-6">
            <Link
              to={catanHref}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300 hover:text-amber-200 underline-offset-4 hover:underline"
            >
              {catanLinkLabel}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-cream px-6 py-3.5 text-sm font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <CmsText field="whatsappLabel" as="span" />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat icon={<Trophy className="h-5 w-5" />} value="3+" labelField="stat1Label" />
            <Stat icon={<Users className="h-5 w-5" />} value="100+" labelField="stat2Label" />
            <Stat icon={<Calendar className="h-5 w-5" />} value="12" labelField="stat3Label" />
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <FloatingTrophy />
        </div>
      </div>
    </section>
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
    <div className="bg-cream/10 border-2 border-cream/30 rounded-2xl p-3 backdrop-blur-sm text-center">
      <div className="flex justify-center mb-1 text-amber-300">{icon}</div>
      <div className="font-display text-2xl font-bold leading-none">{value}</div>
      <CmsText
        field={labelField}
        as="div"
        className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cream/60"
      />
    </div>
  );
}

function FloatingTrophy() {
  return (
    <div className="relative size-[300px] sm:size-[380px] flex items-center justify-center animate-[trophyFloat_6s_ease-in-out_infinite]">
      <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-3xl scale-90" aria-hidden />
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40 animate-[spin_24s_linear_infinite]" aria-hidden />
      <div className="relative z-10 size-48 sm:size-60 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border-4 border-cream shadow-tactile-lg flex items-center justify-center">
        <Trophy className="h-24 w-24 sm:h-32 sm:w-32 text-ink drop-shadow-lg" strokeWidth={1.5} />
      </div>
      {/* Orbiting medals */}
      <Medal className="absolute top-4 right-6 h-8 w-8 text-amber-300 animate-[bounce_3s_ease-in-out_infinite]" />
      <Sparkles className="absolute bottom-8 left-2 h-7 w-7 text-amber-200 animate-[bounce_4s_ease-in-out_infinite_1s]" />
      <Crown className="absolute top-12 left-0 h-7 w-7 text-amber-400 animate-[bounce_3.5s_ease-in-out_infinite_0.5s]" />
      <style>{`
        @keyframes trophyFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

function ConfettiBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.10]" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="confetti" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="10" y="14" width="6" height="14" fill="currentColor" transform="rotate(20 13 21)" />
            <rect x="50" y="40" width="6" height="14" fill="currentColor" transform="rotate(-30 53 47)" />
            <circle cx="30" cy="60" r="3" fill="currentColor" />
            <circle cx="65" cy="10" r="2.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#confetti)" className="text-amber-300" />
      </svg>
    </div>
  );
}

/* -------------------- FORMATS -------------------- */

function FormatsSection() {
  return (
    <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
      <div className="absolute -top-20 -left-20 size-72 bg-coral/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4"
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
            className="mt-4 text-lg text-foreground/75"
          />
        </div>

        {/* Tipo de inscripción cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <article className="bg-card border-2 border-ink rounded-3xl p-7 shadow-tactile hover:-translate-y-1 transition-transform">
            <div className="size-14 rounded-2xl bg-coral text-cream border-2 border-ink flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <CmsText
              field="freeTitle"
              as="h3"
              className="text-2xl font-display font-semibold leading-tight"
            />
            <CmsText
              field="freeBody"
              multiline
              as="p"
              className="mt-3 text-base text-foreground/75 leading-relaxed"
            />
          </article>
          <article className="bg-ink text-cream border-2 border-ink rounded-3xl p-7 shadow-tactile hover:-translate-y-1 transition-transform">
            <div className="size-14 rounded-2xl bg-amber-400 text-ink border-2 border-cream flex items-center justify-center mb-4">
              <Award className="h-7 w-7" />
            </div>
            <CmsText
              field="paidTitle"
              as="h3"
              className="text-2xl font-display font-semibold leading-tight"
            />
            <CmsText
              field="paidBody"
              multiline
              as="p"
              className="mt-3 text-base text-cream/80 leading-relaxed"
            />
          </article>
        </div>

        {/* Formats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CmsList
            field="items"
            addLabel="Añadir formato"
            renderItem={({ index, prefix }) => {
              const Icon = FORMAT_ICONS[index % FORMAT_ICONS.length];
              return (
                <article
                  key={index}
                  className="group relative bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile-sm hover:shadow-tactile transition-all"
                >
                  <div className="size-12 rounded-xl bg-coral/15 text-coral-deep border-2 border-coral/30 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CmsText
                    field={`${prefix}.title`}
                    as="h4"
                    className="text-xl font-display font-semibold leading-tight"
                    placeholder="Formato"
                  />
                  <CmsText
                    field={`${prefix}.body`}
                    multiline
                    as="p"
                    className="mt-2 text-sm text-foreground/70 leading-relaxed"
                    placeholder="Descripción"
                  />
                </article>
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}

const FORMAT_ICONS = [Swords, Target, Users, Trophy, Medal, Crown];

/* -------------------- PRIZES -------------------- */

function PrizesSection() {
  const { editMode } = useEditor();
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-amber-50 to-orange-50 relative overflow-hidden">
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

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto items-end mb-14">
          <PodiumStep place={2} heightClass="h-40 sm:h-52" color="bg-stone-300" />
          <PodiumStep place={1} heightClass="h-56 sm:h-72" color="bg-amber-400" highlight />
          <PodiumStep place={3} heightClass="h-32 sm:h-44" color="bg-orange-400" />
        </div>

        {/* Prize examples list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CmsList
            field="items"
            addLabel="Añadir premio"
            renderItem={({ index, prefix }) => (
              <article
                key={index}
                className="bg-card border-2 border-ink rounded-3xl overflow-hidden shadow-tactile-sm hover:shadow-tactile transition-all flex flex-col"
              >
                <div className="aspect-[4/3] bg-cream-deep">
                  <CmsImage
                    field={`${prefix}.image`}
                    alt=""
                    className="w-full h-full object-cover"
                    emptyLabel={editMode ? "Imagen del premio" : ""}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <CmsText
                    field={`${prefix}.title`}
                    as="h3"
                    className="text-lg font-display font-semibold leading-tight"
                    placeholder="Premio"
                  />
                  <CmsText
                    field={`${prefix}.body`}
                    multiline
                    as="p"
                    className="mt-2 text-sm text-foreground/70 leading-relaxed flex-1"
                    placeholder="Descripción"
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

function PodiumStep({
  place,
  heightClass,
  color,
  highlight,
}: {
  place: number;
  heightClass: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`mb-3 size-16 sm:size-20 rounded-full border-4 border-ink shadow-tactile flex items-center justify-center ${
          highlight ? "bg-amber-400 animate-[bounce_2s_ease-in-out_infinite]" : "bg-card"
        }`}
      >
        <Medal className={`${highlight ? "h-10 w-10 text-ink" : "h-8 w-8 text-coral-deep"}`} />
      </div>
      <div
        className={`relative w-full ${heightClass} ${color} border-4 border-ink rounded-t-2xl shadow-tactile flex items-center justify-center`}
      >
        <span className="font-display font-bold text-5xl sm:text-7xl text-ink">{place}</span>
      </div>
    </div>
  );
}

/* -------------------- GALLERY -------------------- */

function GallerySection() {
  const { editMode } = useEditor();
  return (
    <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
      <div className="absolute -top-16 -right-16 size-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block bg-amber-400 text-ink text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CmsList
            field="items"
            addLabel="Añadir foto"
            renderItem={({ index, prefix }) => (
              <figure
                key={index}
                className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-cream/20 hover:border-amber-400/60 transition-all hover:-translate-y-1"
              >
                <CmsImage
                  field={`${prefix}.image`}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  emptyLabel={editMode ? "Foto" : ""}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs font-bold text-cream opacity-0 group-hover:opacity-100 transition-opacity">
                  <CmsText
                    field={`${prefix}.caption`}
                    as="span"
                    placeholder="Pie de foto"
                  />
                </figcaption>
              </figure>
            )}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------- FAQ -------------------- */

type FaqItem = { category?: string; question?: string; answer?: string };

function FaqSection() {
  const { editMode } = useEditor();
  const { data } = useSection();
  const items = (Array.isArray(data.items) ? (data.items as FaqItem[]) : []);

  return (
    <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 size-72 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 stamp-coral text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            <CmsText field="eyebrow" as="span" />
          </span>
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-foreground/75 max-w-2xl mx-auto"
          />
        </div>

        {editMode ? (
          /* In edit mode: inline editable cards (accordion would block contentEditable) */
          <div className="space-y-4">
            <CmsList
              field="items"
              addLabel="Añadir pregunta"
              renderItem={({ index, prefix }) => (
                <article
                  key={index}
                  className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm"
                >
                  <CmsText
                    field={`${prefix}.category`}
                    as="span"
                    className="inline-block bg-coral/15 text-coral-deep text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 mb-3"
                    placeholder="Categoría"
                  />
                  <CmsText
                    field={`${prefix}.question`}
                    as="h3"
                    className="text-lg font-display font-semibold leading-tight"
                    placeholder="Pregunta"
                  />
                  <CmsText
                    field={`${prefix}.answer`}
                    multiline
                    as="p"
                    className="mt-2 text-sm text-foreground/75 leading-relaxed"
                    placeholder="Respuesta"
                  />
                </article>
              )}
            />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((it, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border-2 border-ink rounded-2xl shadow-tactile-sm overflow-hidden hover:shadow-tactile transition-shadow"
              >
                <AccordionTrigger className="px-5 py-4 hover:no-underline">
                  <div className="flex flex-col items-start text-left gap-1.5 pr-4">
                    {it.category ? (
                      <span className="inline-block bg-coral/15 text-coral-deep text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5">
                        {it.category}
                      </span>
                    ) : null}
                    <span className="text-base sm:text-lg font-display font-semibold leading-snug">
                      {it.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 text-base text-foreground/75 leading-relaxed whitespace-pre-line">
                  {it.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
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
        <div className="relative bg-gradient-to-br from-coral to-coral-deep text-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg overflow-hidden">
          <Trophy className="absolute top-6 left-6 h-20 w-20 text-amber-300/30 -rotate-12" aria-hidden />
          <Medal className="absolute bottom-6 right-6 h-16 w-16 text-amber-300/30 rotate-12" aria-hidden />
          <div className="relative">
            <Crown className="h-12 w-12 text-amber-300 mx-auto" />
            <CmsText
              field="title"
              as="h2"
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold"
            />
            <CmsText
              field="subtitle"
              multiline
              as="p"
              className="mt-4 text-lg text-cream/85 max-w-2xl mx-auto"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-cream px-6 py-3.5 text-sm font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
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
