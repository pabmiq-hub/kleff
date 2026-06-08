import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Link } from "@tanstack/react-router";
import { Calendar, Newspaper } from "lucide-react";
import type { BlogPostSummary } from "@/lib/blog.functions";

export function BlogListPage({ posts }: { posts: BlogPostSummary[] }) {
  const { locale } = useI18n();
  const copy = {
    es: {
      eyebrow: "Blog",
      title: "Todo lo que pasa en la mesa",
      body: "Reseñas, recomendaciones y crónicas de nuestras noches de juegos en Barcelona.",
      empty: "Estamos preparando los primeros artículos. Vuelve en unos días.",
      readMore: "Leer artículo",
    },
    en: {
      eyebrow: "Blog",
      title: "Everything that happens at the table",
      body: "Reviews, recommendations and stories from our Barcelona game nights.",
      empty: "We're preparing the first posts. Come back in a few days.",
      readMore: "Read article",
    },
    ca: {
      eyebrow: "Blog",
      title: "Tot el que passa a la taula",
      body: "Ressenyes, recomanacions i cròniques de les nostres nits de jocs a Barcelona.",
      empty: "Estem preparant els primers articles. Torna en uns dies.",
      readMore: "Llegir article",
    },
  }[locale];

  const dateLocale = locale === "ca" ? "ca-ES" : locale === "en" ? "en-GB" : "es-ES";

  // URL pattern matches the original WordPress structure exactly:
  //   ES:  /{slug}
  //   EN:  /en/{slug}
  //   CA:  /ca/{slug}
  const pathFor = (slug: string) =>
    locale === "es" ? `/${slug}` : locale === "en" ? `/en/${slug}` : `/ca/${slug}`;

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-28 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral-deep">
            {copy.eyebrow}
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-display font-semibold text-foreground">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg text-foreground/75">{copy.body}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/60 px-6 py-20 text-center">
            <Newspaper className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{copy.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={pathFor(p.slug)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:shadow-elegant transition-all hover:-translate-y-0.5"
              >
                {p.cover_image_url ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={400}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary-soft to-coral/20" />
                )}
                <div className="flex-1 flex flex-col p-5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(p.published_at).toLocaleDateString(dateLocale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <h2 className="mt-2 text-xl font-display font-semibold text-foreground group-hover:text-coral transition-colors line-clamp-2">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 text-sm text-foreground/70 line-clamp-3">{p.excerpt}</p>
                  )}
                  <span className="mt-4 text-sm font-semibold text-coral">{copy.readMore} →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
