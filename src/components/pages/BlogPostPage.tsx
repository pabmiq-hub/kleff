import { useI18n } from "@/i18n/I18nProvider";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Calendar, User } from "lucide-react";
import type { BlogPostFull } from "@/lib/blog.functions";

export function BlogPostPage({ post }: { post: BlogPostFull }) {
  const { locale, href } = useI18n();
  const dateLabel = new Date(post.published_at).toLocaleDateString(
    locale === "ca" ? "ca-ES" : locale === "en" ? "en-GB" : "es-ES",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const backLabel =
    locale === "ca" ? "Tornar al blog" : locale === "en" ? "Back to blog" : "Volver al blog";

  return (
    <SiteLayout>
      <article className="bg-background">
        {post.cover_image_url && (
          <div className="relative w-full aspect-[21/9] md:aspect-[21/8] overflow-hidden bg-muted">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-20 relative">
          <Link
            to={href("/blog")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:text-coral-deep transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" /> {backLabel}
          </Link>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {dateLabel}
            </span>
            {post.author_name && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
            )}
          </div>

          {post.translationMissing && (
            <div className="mt-6 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {locale === "ca"
                ? "Aquest article encara no està traduït al català. Es mostra la versió original en anglès."
                : locale === "es"
                  ? "Este artículo aún no está traducido al castellano. Se muestra la versión original en inglés."
                  : "Showing the original version."}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none mt-10 mb-20 prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-coral prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-strong:text-foreground"
            // Content originates from our own WordPress and is preserved as HTML.
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </SiteLayout>
  );
}
