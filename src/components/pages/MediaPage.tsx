import { useRouterState } from "@tanstack/react-router";
import { Sparkles, ExternalLink, Instagram, Newspaper, Calendar } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import type { MediaItem } from "@/server/media.functions";

type LoaderData = { mediaItems: MediaItem[] };

function useMediaData(): MediaItem[] {
  const data = useRouterState({
    select: (s) => {
      for (const m of s.matches) {
        const ld: any = m.loaderData;
        if (ld && Array.isArray(ld.mediaItems)) return ld as LoaderData;
      }
      return null;
    },
  });
  return data?.mediaItems ?? [];
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function MediaCard({ item, fallbackLabel }: { item: MediaItem; fallbackLabel: string }) {
  const title = item.titleOverride ?? item.ogTitle ?? item.outlet ?? hostnameOf(item.url);
  const desc =
    item.descriptionOverride ?? item.ogDescription ?? `${item.outlet ?? hostnameOf(item.url)}`;
  const image = item.imageOverride ?? item.ogImage;
  const outlet = item.outlet ?? item.ogSiteName ?? hostnameOf(item.url);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-card border-2 border-ink rounded-3xl overflow-hidden shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all duration-200"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-ink bg-cream-deep">
        {image ? (
          <img
            src={image}
            alt={title ?? ""}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-coral text-cream">
            <Newspaper className="h-16 w-16 opacity-80" />
          </div>
        )}
        {item.date && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-cream text-ink border-2 border-ink rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-tactile-sm">
            <Calendar className="h-3 w-3" /> {item.date}
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

export function MediaPage() {
  const { t, locale } = useI18n();
  const items = useMediaData();

  // Group items by year for a cleaner cronological feel
  const byYear = items.reduce<Record<number, MediaItem[]>>((acc, item) => {
    (acc[item.year] = acc[item.year] ?? []).push(item);
    return acc;
  }, {});
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative bg-cream overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 border-2 border-coral/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-coral-deep">
            <Sparkles className="h-3.5 w-3.5" /> {t.media.eyebrow}
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold leading-[0.98] tracking-tight">
            {t.media.title}
          </h1>
          <p className="mt-7 text-lg sm:text-xl text-foreground/75 max-w-3xl mx-auto leading-relaxed">
            {t.media.intro}
          </p>
        </div>
      </section>

      {/* PRESS GRID — chronological by year */}
      <section className="py-16 md:py-20 bg-cream-deep/40 border-y-2 border-ink/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="inline-block stamp-ink text-xs font-bold uppercase tracking-widest mb-4">
              {t.media.pressTitle}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold leading-tight">
              {t.media.pressSubtitle}
            </h2>
          </div>

          {years.length === 0 ? (
            <p className="text-center text-foreground/60 py-12">{t.media.loading}</p>
          ) : (
            <div className="space-y-16">
              {years.map((year) => (
                <div key={year}>
                  <div className="flex items-end gap-4 mb-8">
                    <span className="font-display font-bold text-5xl sm:text-6xl text-coral leading-none tabular-nums">
                      {year}
                    </span>
                    <span className="flex-1 newspaper-rule mb-3" />
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3 tabular-nums">
                      {byYear[year].length}{" "}
                      {locale === "en"
                        ? "appearances"
                        : locale === "ca"
                          ? "aparicions"
                          : "apariciones"}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                    {byYear[year].map((item) => (
                      <MediaCard key={item.url} item={item} fallbackLabel={t.media.visitArticle} />
                    ))}
                  </div>
                </div>
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
              <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-display font-semibold leading-tight">
                {t.media.instagramTitle}
              </h2>
              <p className="mt-5 text-lg text-foreground/75 leading-relaxed">
                {t.media.instagramSubtitle}
              </p>
              <a
                href="https://www.instagram.com/kleff.bcn/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink text-cream border-2 border-ink px-7 py-4 text-base font-bold shadow-tactile hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-tactile-sm transition-all"
              >
                <Instagram className="h-5 w-5" />
                {t.media.instagramCta}
              </a>
              <p className="mt-4 text-sm text-foreground/60 tabular-nums">
                <strong className="text-foreground">10,3k</strong>{" "}
                {locale === "en"
                  ? "followers on Instagram"
                  : locale === "ca"
                    ? "seguidors a Instagram"
                    : "seguidores en Instagram"}
              </p>
            </div>

            <div className="lg:col-span-7">
              {/* Embedded Instagram feed via LightWidget (free, no auth required) */}
              <div className="relative bg-card border-4 border-ink rounded-3xl shadow-tactile-lg overflow-hidden">
                <iframe
                  title="Instagram @kleff.bcn"
                  src="https://cdn.lightwidget.com/widgets/cb1a85d80c34e95c2e57c4f8b6eecaba.html"
                  scrolling="no"
                  allowtransparency={true as unknown as boolean}
                  className="lightwidget-widget w-full"
                  style={{
                    width: "100%",
                    border: 0,
                    overflow: "hidden",
                    minHeight: 480,
                  }}
                />
              </div>
              <p className="mt-3 text-center text-xs font-mono uppercase tracking-widest text-foreground/40">
                Live feed · @kleff.bcn
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
