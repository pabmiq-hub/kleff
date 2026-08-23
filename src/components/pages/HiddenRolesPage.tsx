import { useEffect, useMemo, useState } from "react";
import {
  EyeOff,
  MessageCircle,
  Sparkles,
  Skull,
  Search,
  Users,
  Calendar,
  ArrowRight,
  Crown,
  VenetianMask,
  Star,
  PartyPopper,
  Library,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionProvider, useSection, useSectionValue } from "@/cms/SectionContext";
import { CmsImage, CmsList, CmsText } from "@/cms/Editable";
import { useEditor } from "@/editor/EditorProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

const SafeMask = VenetianMask;

export function HiddenRolesPage() {
  return (
    <SiteLayout>
      <SectionProvider sectionKey="hiddenRoles.hero">
        <HeroSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.intro">
        <IntroSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.types">
        <TypesSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.clocktower">
        <ClocktowerSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.murder">
        <MurderSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.fest">
        <FestSection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.library">
        <LibrarySection />
      </SectionProvider>

      <SectionProvider sectionKey="hiddenRoles.cta">
        <CtaSection />
      </SectionProvider>
    </SiteLayout>
  );
}

/* -------------------- shared backdrop -------------------- */

function MysteryBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="masks" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="30" r="2" fill="currentColor" />
            <circle cx="80" cy="80" r="2.5" fill="currentColor" />
            <path d="M40 60 Q50 50 60 60" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M85 25 l4 4 m0 -4 l-4 4" stroke="currentColor" strokeWidth="1.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#masks)" className="text-cream" />
      </svg>
    </div>
  );
}

/* -------------------- HERO -------------------- */

function HeroSection() {
  const whatsappUrl = useSectionValue<string>("whatsappUrl", "");
  return (
    <section className="relative overflow-hidden bg-[#0e0820] text-cream border-b-2 border-ink/15">
      {/* Atmospheric layered backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,70,239,0.25),_transparent_60%),radial-gradient(ellipse_at_bottom_left,_rgba(244,63,94,0.18),_transparent_55%)]" aria-hidden />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:40px_40px]" aria-hidden />
      <MysteryBackdrop />

      {/* Floating question marks */}
      <span className="pointer-events-none absolute top-[12%] left-[8%] text-fuchsia-300/30 font-display text-7xl select-none animate-[hrFloat_7s_ease-in-out_infinite]" aria-hidden>?</span>
      <span className="pointer-events-none absolute top-[60%] left-[3%] text-rose-300/25 font-display text-5xl select-none animate-[hrFloat_5s_ease-in-out_infinite_1s]" aria-hidden>?</span>
      <span className="pointer-events-none absolute top-[20%] right-[6%] text-amber-200/25 font-display text-6xl select-none animate-[hrFloat_6s_ease-in-out_infinite_0.5s]" aria-hidden>?</span>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 lg:pb-28">
        {/* Centered eyebrow + title block */}
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-cream/10 backdrop-blur-sm border-2 border-fuchsia-300/40 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-200">
            <EyeOff className="h-3.5 w-3.5" />
            <CmsText field="eyebrow" as="span" />
          </span>
          <CmsText
            field="title"
            as="h1"
            className="mt-7 font-display font-semibold text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.98] tracking-tight bg-gradient-to-br from-cream via-fuchsia-100 to-rose-200 bg-clip-text text-transparent"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-7 text-lg sm:text-xl text-cream/75 max-w-2xl mx-auto leading-relaxed"
          />
        </div>

        {/* Fanned role cards */}
        <div className="relative mt-14 mb-12 flex justify-center items-end h-[200px] sm:h-[240px]">
          <HeroRoleCard rotate="-rotate-[18deg]" translate="-translate-x-32 sm:-translate-x-44 translate-y-4" tone="bg-fuchsia-100" icon={<Star className="h-7 w-7 text-fuchsia-700" />} label="LEAL" delay="0s" />
          <HeroRoleCard rotate="-rotate-[8deg]" translate="-translate-x-16 sm:-translate-x-24 translate-y-1" tone="bg-amber-100" icon={<EyeOff className="h-7 w-7 text-amber-700" />} label="ESPÍA" delay="0.3s" />
          <HeroRoleCard rotate="rotate-0" translate="translate-y-0 z-10" tone="bg-cream" icon={<SafeMask className="h-7 w-7 text-fuchsia-700" />} label="¿?" delay="0.6s" featured />
          <HeroRoleCard rotate="rotate-[8deg]" translate="translate-x-16 sm:translate-x-24 translate-y-1" tone="bg-rose-100" icon={<Skull className="h-7 w-7 text-rose-700" />} label="TRAIDOR" delay="0.9s" />
          <HeroRoleCard rotate="rotate-[18deg]" translate="translate-x-32 sm:translate-x-44 translate-y-4" tone="bg-purple-100" icon={<Crown className="h-7 w-7 text-purple-700" />} label="REY" delay="1.2s" />
        </div>

        {/* CTA + stats */}
        <div className="flex flex-col items-center gap-10">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] text-white border-2 border-cream px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-tactile-sm transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            <CmsText field="whatsappLabel" as="span" />
            <ArrowRight className="h-4 w-4" />
          </a>

          <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full max-w-2xl">
            <Stat icon={<Users className="h-5 w-5" />} valueField="stat1Value" labelField="stat1Label" />
            <Stat icon={<Calendar className="h-5 w-5" />} valueField="stat2Value" labelField="stat2Label" />
            <Stat icon={<PartyPopper className="h-5 w-5" />} valueField="stat3Value" labelField="stat3Label" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hrFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes hrCardIn {
          0% { opacity: 0; transform: translateY(40px) scale(0.85); }
          100% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

function HeroRoleCard({
  rotate,
  translate,
  tone,
  icon,
  label,
  delay,
  featured = false,
}: {
  rotate: string;
  translate: string;
  tone: string;
  icon: React.ReactNode;
  label: string;
  delay: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`absolute ${translate} ${rotate} ${tone} ${featured ? "size-36 sm:size-44 shadow-tactile-lg ring-2 ring-fuchsia-300/60" : "size-28 sm:size-36 shadow-tactile"} border-2 border-ink rounded-2xl flex flex-col items-center justify-center transition-transform hover:-translate-y-2`}
      style={{ animation: `hrCardIn 0.7s ease-out ${delay} both` }}
    >
      <div className="size-10 sm:size-12 rounded-xl bg-cream border-2 border-ink flex items-center justify-center">
        {icon}
      </div>
      <span className="mt-2 font-display font-bold text-sm sm:text-base tracking-wider text-ink">
        {label}
      </span>
      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-ink/50">
        Rol secreto
      </span>
    </div>
  );
}

function Stat({
  icon,
  valueField,
  labelField,
}: {
  icon: React.ReactNode;
  valueField: string;
  labelField: string;
}) {
  return (
    <div className="bg-cream/10 border-2 border-cream/30 rounded-2xl p-3 backdrop-blur-sm text-center">
      <div className="flex justify-center mb-1 text-fuchsia-300">{icon}</div>
      <CmsText
        field={valueField}
        as="div"
        className="font-display text-2xl font-bold leading-none"
      />
      <CmsText
        field={labelField}
        as="div"
        className="mt-1 text-[10px] font-bold uppercase tracking-widest text-cream/60"
      />
    </div>
  );
}


/* -------------------- INTRO -------------------- */

function IntroSection() {
  return (
    <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
      <div className="absolute -top-20 -left-20 size-72 bg-fuchsia-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block stamp-coral text-xs font-bold uppercase tracking-widest mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-[1.05]"
          />
          <CmsText
            field="body"
            multiline
            as="p"
            className="mt-6 text-lg text-foreground/75 leading-relaxed whitespace-pre-line"
          />
        </div>
        <div className="md:col-span-5">
          <div className="relative aspect-square">
            {/* Stack of role cards */}
            <RoleCard className="absolute inset-0 -rotate-6 bg-fuchsia-100" label="LEAL" icon={<Star className="h-10 w-10 text-fuchsia-700" />} />
            <RoleCard className="absolute inset-0 rotate-3 translate-x-4 -translate-y-4 bg-amber-100" label="ESPÍA" icon={<EyeOff className="h-10 w-10 text-amber-700" />} />
            <RoleCard className="absolute inset-0 rotate-12 translate-x-10 -translate-y-2 bg-rose-100" label="TRAIDOR" icon={<Skull className="h-10 w-10 text-rose-700" />} />
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleCard({
  className,
  label,
  icon,
}: {
  className?: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border-2 border-ink shadow-tactile p-6 flex flex-col items-center justify-center text-center ${className ?? ""}`}
    >
      <div className="size-20 rounded-2xl bg-cream border-2 border-ink flex items-center justify-center">
        {icon}
      </div>
      <span className="mt-4 inline-block font-display font-bold text-2xl tracking-wider text-ink">
        {label}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink/60">
        Rol secreto
      </span>
    </div>
  );
}

/* -------------------- TYPES -------------------- */

function TypesSection() {
  return (
    <section className="py-20 md:py-28 bg-cream-deep/40 border-y-2 border-ink/10 relative overflow-hidden">
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
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
          />
          <CmsText
            field="subtitle"
            multiline
            as="p"
            className="mt-4 text-lg text-foreground/75"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          <CmsList
            field="items"
            addLabel="Añadir tipo"
            renderItem={({ index, prefix }) => {
              const rotate = index % 2 === 0 ? "-rotate-1" : "rotate-1";
              return (
                <article
                  key={index}
                  className={`relative bg-card border-2 border-ink rounded-3xl p-6 shadow-tactile hover:-translate-y-1 transition-transform ${rotate}`}
                >
                  {/* Sticker tag that "sticks out" */}
                  <span className="absolute -top-4 -right-4 z-10 inline-flex items-center gap-1.5 bg-fuchsia-500 text-cream border-2 border-ink rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-tactile-sm rotate-6">
                    <CmsText field={`${prefix}.tag`} as="span" placeholder="Etiqueta" />
                  </span>
                  <div className="size-12 rounded-xl bg-fuchsia-100 text-fuchsia-700 border-2 border-ink flex items-center justify-center mb-4">
                    <SafeMask className="h-6 w-6" />
                  </div>
                  <CmsText
                    field={`${prefix}.title`}
                    as="h3"
                    className="text-xl font-display font-semibold leading-tight"
                    placeholder="Título"
                  />
                  <CmsText
                    field={`${prefix}.body`}
                    multiline
                    as="p"
                    className="mt-2 text-sm text-foreground/70 leading-relaxed"
                    placeholder="Descripción"
                  />
                  <CmsText
                    field={`${prefix}.example`}
                    as="div"
                    className="mt-4 text-xs font-bold uppercase tracking-widest text-coral-deep"
                    placeholder="Ej.: …"
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

/* -------------------- CLOCKTOWER LINK -------------------- */

function ClocktowerSection() {
  const { locale } = useI18n();
  const href =
    locale === "en" ? "/en/blood-on-the-clocktower" : locale === "ca" ? "/ca/blood-on-the-clocktower" : "/blood-on-the-clocktower";
  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          to={href}
          className="group block bg-gradient-to-br from-rose-700 via-coral-deep to-rose-900 text-cream border-4 border-ink rounded-[2.5rem] p-8 sm:p-12 shadow-tactile-lg hover:-translate-y-1 transition-transform"
        >
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-2 flex justify-center">
              <div className="size-20 rounded-2xl bg-cream/15 border-2 border-cream/40 flex items-center justify-center">
                <Skull className="h-10 w-10 text-cream" />
              </div>
            </div>
            <div className="md:col-span-8">
              <CmsText
                field="eyebrow"
                as="span"
                className="inline-block bg-cream text-ink text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
              />
              <CmsText
                field="title"
                as="h2"
                className="text-3xl sm:text-4xl font-display font-semibold leading-tight"
              />
              <CmsText
                field="body"
                multiline
                as="p"
                className="mt-3 text-base sm:text-lg text-cream/85 leading-relaxed"
              />
            </div>
            <div className="md:col-span-2 flex md:justify-end">
              <span className="inline-flex items-center gap-2 bg-cream text-ink border-2 border-ink rounded-full px-5 py-3 text-sm font-bold shadow-tactile-sm group-hover:translate-x-1 transition-transform">
                <CmsText field="ctaLabel" as="span" />
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* -------------------- MURDER MYSTERY -------------------- */

function MurderSection() {
  const { editMode } = useEditor();
  return (
    <section className="py-20 md:py-28 bg-ink text-cream relative overflow-hidden">
      <MysteryBackdrop />
      <div className="absolute -top-16 -left-16 size-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-block bg-rose-500 text-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight"
          />
          <CmsText
            field="body"
            multiline
            as="p"
            className="mt-5 text-lg text-cream/80 leading-relaxed"
          />

          <ul className="mt-8 space-y-3">
            {(["feature1", "feature2", "feature3"] as const).map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-rose-500 text-cream border border-cream/40">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <CmsText field={f} as="span" className="text-base text-cream/90" />
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-5">
          <div className="relative">
            <div className="absolute -inset-4 rotate-2 bg-rose-500/20 rounded-3xl blur-2xl" aria-hidden />
            <div className="relative aspect-[4/5] rounded-3xl border-4 border-cream/30 overflow-hidden bg-cream/5">
              <CmsImage
                field="image"
                alt=""
                className="w-full h-full object-cover"
                emptyLabel={editMode ? "Imagen ambiente" : ""}
              />
              {/* Decorative tape */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rotate-3 bg-amber-300 text-ink text-[10px] font-bold tracking-widest px-8 py-1 shadow-tactile-sm">
                CRIME SCENE — DO NOT CROSS
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- FEST -------------------- */

function FestSection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-fuchsia-50 via-cream to-amber-50 relative overflow-hidden">
      <div className="absolute -bottom-20 -right-20 size-80 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <CmsText
            field="eyebrow"
            as="span"
            className="inline-flex items-center gap-2 bg-ink text-cream text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 mb-4"
          />
          <CmsText
            field="title"
            as="h2"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold leading-tight text-ink"
          />
          <CmsText
            field="body"
            multiline
            as="p"
            className="mt-5 text-lg text-foreground/75 leading-relaxed"
          />
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(["bullet1", "bullet2", "bullet3", "bullet4"] as const).map((f, i) => {
            const Icon = [Users, Search, Skull, Crown][i];
            return (
              <div
                key={f}
                className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm flex items-start gap-3"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500 text-cream border-2 border-ink">
                  <Icon className="h-5 w-5" />
                </span>
                <CmsText field={f} as="div" className="text-sm font-bold leading-snug pt-1.5" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------- LIBRARY -------------------- */

type LudoyaGame = {
  id: string;
  slug: string;
  name: string;
  bggRating?: number;
  image?: { thumbnailUrl?: string; previewUrl?: string; url?: string };
};

function LibrarySection() {
  const { locale } = useI18n();
  const { data } = useSection();
  const slugList = useMemo(() => {
    const arr = Array.isArray(data.slugs) ? (data.slugs as { slug?: string }[]) : [];
    return arr.map((x) => (x?.slug ?? "").trim().toLowerCase()).filter(Boolean);
  }, [data.slugs]);

  const [games, setGames] = useState<LudoyaGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.ludoya.com/users/kleff/boardgames")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { games: LudoyaGame[] }) => {
        if (!cancelled) setGames(d.games ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = useMemo(() => {
    if (!games) return [];
    const set = new Set(slugList);
    const matches = games.filter((g) => set.has(g.slug.toLowerCase()));
    return matches
      .sort((a, b) => (b.bggRating ?? 0) - (a.bggRating ?? 0))
      .slice(0, 8);
  }, [games, slugList]);

  const ludotecaHref =
    locale === "en" ? "/en/ludoteca" : locale === "ca" ? "/ca/ludoteca" : "/ludoteca";

  return (
    <section className="py-20 md:py-28 bg-cream-deep/30 relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
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
            className="mt-4 text-base sm:text-lg text-foreground/70"
          />
        </div>

        {error ? (
          <p className="text-sm text-rose-700">No hemos podido cargar los juegos ahora mismo.</p>
        ) : !games ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-cream-deep/60 border-2 border-ink/10 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="text-sm text-foreground/60">
            Todavía no hay juegos para mostrar. Edita los slugs candidatos en la sección.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {top.map((g) => (
              <article
                key={g.id}
                className="group bg-card border-2 border-ink rounded-2xl overflow-hidden shadow-tactile-sm hover:shadow-tactile hover:-translate-y-1 transition-all"
              >
                <div className="aspect-square bg-cream-deep/40 overflow-hidden">
                  {g.image?.thumbnailUrl || g.image?.previewUrl || g.image?.url ? (
                    <img
                      src={g.image.thumbnailUrl ?? g.image.previewUrl ?? g.image.url}
                      alt={g.name}
                      width={400}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                </div>
                <div className="px-2.5 py-2 text-center">
                  <h3 className="text-xs sm:text-sm font-bold leading-tight line-clamp-2">
                    {g.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link
            to={ludotecaHref}
            className="inline-flex items-center gap-2 bg-ink text-cream border-2 border-ink rounded-2xl px-5 py-3 text-sm font-bold shadow-tactile-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Library className="h-4 w-4" />
            <CmsText field="ctaLabel" as="span" />
            <ArrowRight className="h-4 w-4" />
          </Link>
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
        <div className="relative bg-gradient-to-br from-fuchsia-700 via-purple-800 to-ink text-cream border-4 border-ink rounded-[2.5rem] px-6 sm:px-14 py-12 sm:py-16 text-center shadow-tactile-lg overflow-hidden">
          <MysteryBackdrop />
          <EyeOff className="absolute top-6 left-6 h-20 w-20 text-fuchsia-300/30 -rotate-12" aria-hidden />
          <Skull className="absolute bottom-6 right-6 h-16 w-16 text-fuchsia-300/30 rotate-12" aria-hidden />
          <div className="relative">
            <SafeMask className="h-12 w-12 text-fuchsia-300 mx-auto" />
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
