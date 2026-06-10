import { useState, type SyntheticEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Sparkles,
  ExternalLink,
  Instagram,
  Newspaper,
  Calendar,
  ChevronDown,
  Play,
  Images,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import type { InstagramPost } from "@/lib/media.functions";
import type { MediaAppearance } from "@/lib/media-appearances.functions";
import { EditableText } from "@/editor/Editable";
import { useSectionContent } from "@/cms/useSectionContent";
import { or } from "@/cms/or";

type LoaderData = {
  mediaItems: MediaAppearance[];
  followers: { count: number | null; updatedAt: string };
  igPosts: InstagramPost[];
};

function useMediaData(): LoaderData {
  const data = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld && Array.isArray(ld.mediaItems)) return ld as LoaderData;
      }
      return null;
    },
  });
  return (
    data ?? {
      mediaItems: [],
      followers: { count: null, updatedAt: new Date().toISOString() },
      igPosts: [],
    }
  );
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function handleMediaImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  const fallback = img.nextElementSibling as HTMLElement | null;
  img.style.display = "none";
  if (fallback) fallback.style.display = "flex";
}

export function MediaCard({
  item,
  fallbackLabel,
}: {
  item: MediaAppearance;
  fallbackLabel: string;
}) {
  const title = item.title || item.outlet || hostnameOf(item.url);
  const desc = item.description ?? "";
  const image = item.imageUrl;
  const outlet = item.outlet || hostnameOf(item.url);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-card border-2 border-ink rounded-3xl overflow-hidden shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-ink bg-cream-deep">
        {image ? (
          <>
            <img
              src={image}
              alt={title ?? ""}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={handleMediaImageError}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-gradient-coral text-cream">
              <Newspaper className="h-16 w-16 opacity-80" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-coral text-cream">
            <Newspaper className="h-16 w-16 opacity-80" />
          </div>
        )}
        {item.dateLabel && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-cream text-ink border-2 border-ink rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-tactile-sm">
            <Calendar className="h-3 w-3" /> {item.dateLabel}
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-coral-deep">
          {outlet}
        </span>
        <h3 className="mt-2 text-xl font-display font-semibold text-foreground leading-snug line-clamp-3">
          {title || fallbackLabel}
        </h3>
        {desc && (
          <p className="mt-3 text-sm text-foreground/70 leading-relaxed line-clamp-3 flex-1">
            {desc}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-coral-deep group-hover:gap-2.5 transition-all">
          <ExternalLink className="h-4 w-4" />
          {fallbackLabel}
        </span>
      </div>
    </a>
  );
}

function YearAccordion({
  year,
  items,
  defaultOpen,
  fallbackLabel,
  appearancesLabel,
}: {
  year: number;
  items: MediaAppearance[];
  defaultOpen: boolean;
  fallbackLabel: string;
  appearancesLabel: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-ink rounded-3xl bg-cream shadow-tactile overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 px-6 sm:px-8 py-5 sm:py-6 text-left hover:bg-coral/5 transition-colors"
      >
        <span className="font-display font-bold text-4xl sm:text-5xl text-coral leading-none tabular-nums">
          {year}
        </span>
        <span className="flex-1 newspaper-rule" />
        <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-foreground/60 tabular-nums whitespace-nowrap">
          {items.length} {appearancesLabel}
        </span>
        <ChevronDown
          className={`h-6 w-6 text-ink transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t-2 border-ink/15 bg-cream-deep/30 px-5 sm:px-7 py-7 sm:py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} fallbackLabel={fallbackLabel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFollowers(count: number | null, locale: string): string {
  if (count == null) return "—";
  if (count >= 1000) {
    const k = count / 1000;
    const formatted =
      locale === "en" ? k.toFixed(1).replace(/\.0$/, "") : k.toFixed(1).replace(".", ",").replace(/,0$/, "");
    return `${formatted}K`;
  }
  return count.toLocaleString(locale === "en" ? "en-US" : "es-ES");
}

export function MediaPage() {
  const { t, locale } = useI18n();
  const { mediaItems: items, followers, igPosts } = useMediaData();
  const hero = useSectionContent("media.hero");
  const ig = useSectionContent("media.instagram");

  // Group items by year, newest first
  const byYear = items.reduce<Record<number, MediaAppearance[]>>((acc, item) => {
    (acc[item.year] = acc[item.year] ?? []).push(item);
    return acc;
  }, {});
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  const appearancesLabel =
    locale === "en" ? "appearances" : locale === "ca" ? "aparicions" : "apariciones";
  const followersLabel =
    locale === "en"
      ? "followers on Instagram"
      : locale === "ca"
        ? "seguidors a Instagram"
        : "seguidores en Instagram";

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
            <Sparkles className="h-3.5 w-3.5" />
          <EditableText id="media.hero.eyebrow" as="span">{or(hero.eyebrow, t.media.eyebrow)}</EditableText>
          </span>
          <EditableText id="media.hero.title" as="h1" className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[0.98] tracking-tight">
            {or(hero.title, t.media.title)}
          </EditableText>
          <EditableText id="media.hero.intro" as="p" className="mt-7 text-lg sm:text-xl text-foreground/75 max-w-3xl mx-auto leading-relaxed">
            {or(hero.intro, t.media.intro)}
          </EditableText>
        </div>
      </section>

      {/* PRESS — collapsible accordions per year */}
      <section className="py-16 md:py-20 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {t.media.pressTitle}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold leading-tight">
              {t.media.pressSubtitle}
            </h2>
            <p className="mt-4 text-sm text-foreground/60">
              {locale === "en"
                ? "Click each year to expand."
                : locale === "ca"
                  ? "Fes clic a cada any per desplegar-lo."
                  : "Haz click en cada año para desplegarlo."}
            </p>
          </div>

          {years.length === 0 ? (
            <p className="text-center text-foreground/60 py-12">{t.media.loading}</p>
          ) : (
            <div className="space-y-4">
              {years.map((year, i) => (
                <YearAccordion
                  key={year}
                  year={year}
                  items={byYear[year]}
                  defaultOpen={i === 0}
                  fallbackLabel={t.media.visitArticle}
                  appearancesLabel={appearancesLabel}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 bg-coral text-cream border-2 border-ink rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-tactile-sm">
                <Instagram className="h-3.5 w-3.5" /> @kleff.bcn
              </span>
              <EditableText id="media.instagram.title" as="h2" className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold leading-tight">
                {or(ig.title, t.media.instagramTitle)}
              </EditableText>
              <EditableText id="media.instagram.subtitle" as="p" className="mt-5 text-lg text-foreground/75 leading-relaxed">
                {or(ig.subtitle, t.media.instagramSubtitle)}
              </EditableText>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all"
              >
                <Instagram className="h-5 w-5" />
                {or(ig.ctaLabel, t.media.instagramCta)}
              </a>
              <p className="mt-4 text-sm text-foreground/60 tabular-nums">
                <strong className="text-foreground">{formatFollowers(followers.count, locale)}</strong>{" "}
                {followersLabel}
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden p-5 sm:p-6">
                <a
                  href="https://www.instagram.com/kleff.bcn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir Instagram @kleff.bcn"
                  className="group flex items-center gap-3 mb-5"
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-coral border-2 border-ink flex items-center justify-center text-cream">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-foreground">@kleff.bcn</p>
                    <p className="text-[11px] text-foreground/60">
                      {locale === "en"
                        ? "Barcelona · Board games community"
                        : locale === "ca"
                          ? "Barcelona · Comunitat de jocs de taula"
                          : "Barcelona · Comunidad de juegos de mesa"}
                    </p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-coral-deep group-hover:gap-2.5 transition-all">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t.media.instagramCta}
                  </span>
                </a>

                {igPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {igPosts.slice(0, 9).map((post) => (
                      <a
                        key={post.id}
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={post.caption.slice(0, 80) || "Ver en Instagram"}
                        className="group relative aspect-square rounded-xl border-2 border-ink overflow-hidden bg-ink/5 block"
                      >
                        {post.thumbnailUrl ? (
                          <img
                            src={post.thumbnailUrl}
                            alt={post.caption.slice(0, 120) || "@kleff.bcn"}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-coral text-cream">
                            <Instagram className="h-7 w-7" />
                          </div>
                        )}
                        {post.mediaType === "VIDEO" && (
                          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-ink/80 text-cream">
                            <Play className="h-3.5 w-3.5" fill="currentColor" />
                          </span>
                        )}
                        {post.mediaType === "CAROUSEL_ALBUM" && (
                          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-ink/80 text-cream">
                            <Images className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors flex items-center justify-center">
                          <Instagram className="h-6 w-6 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl border-2 border-ink overflow-hidden bg-cream-deep animate-pulse"
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-xs font-mono uppercase tracking-widest text-foreground/40">
                @kleff.bcn ·{" "}
                {locale === "en"
                  ? "Tap a post to open Instagram"
                  : locale === "ca"
                    ? "Toca una publicació per obrir Instagram"
                    : "Toca una publicación para abrir Instagram"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
