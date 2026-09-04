import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { lookupRedirect } from "@/lib/redirects.functions";
import { getBlogPostBySlug } from "@/lib/blog.functions";
import { BlogPostPage } from "@/components/pages/BlogPostPage";
import { resolveCustomPage, getPageBlocks } from "@/lib/blocks.functions";
import { CustomPage } from "@/components/pages/CustomPage";
import { getPublishedForm } from "@/lib/registrations.functions";
import { resolveKonEvent } from "@/lib/kon-public.functions";
import { PublicRegistrationPage } from "@/components/pages/PublicRegistrationPage";

type Locale = "es" | "ca" | "en";

/**
 * Catch-all route. Handles, in order:
 *  1. Registration form at root (kleff.es/<slug>).
 *  2. CMS custom pages (content_pages with slug_es/ca/en).
 *  3. Locale-prefixed or root single-segment blog post slugs (legacy WP URLs).
 *  4. 301 redirects stored in `content_redirects`.
 *  5. 404 page.
 */
export const Route = createFileRoute("/$")({
  loader: async ({ location }) => {
    const pathname = location.pathname;
    const trimmed = pathname.replace(/\/+$/, "");
    const segments = trimmed.split("/").filter(Boolean);

    // Try to interpret as a single-segment slug.
    let locale: Locale = "es";
    let slugCandidate: string | null = null;

    if (segments.length === 1) {
      slugCandidate = segments[0];
    } else if (segments.length === 2 && (segments[0] === "en" || segments[0] === "ca")) {
      locale = segments[0] as Locale;
      slugCandidate = segments[1];
    }

    try {
      if (slugCandidate && isPlausibleSlug(slugCandidate)) {
        // 1) Registration form (highest priority — slug-in-root).
        // Only check on root locale (es) — registrations are monolingual.
        if (locale === "es") {
          const reg = await getPublishedForm({ data: { slug: slugCandidate } });
          if (reg.form) {
            // External redirect: 302 to external URL
            if (reg.form.kind === "external" && reg.form.external_mode === "redirect" && reg.form.external_url) {
              throw redirect({ href: reg.form.external_url, statusCode: 302, reloadDocument: true });
            }
            return { kind: "registration" as const, form: reg.form, questions: reg.questions, responsesCount: reg.responsesCount };
          }
        }

        // 2) Custom CMS page.
        const { page } = await resolveCustomPage({ data: { slug: slugCandidate, locale } });
        if (page && page.is_published) {
          const { blocks } = await getPageBlocks({ data: { pageId: page.id, locale } });
          return { kind: "custom" as const, page, blocks, locale };
        }
        // 3) Blog post (WordPress slug).
        const { post } = await getBlogPostBySlug({ data: { slug: slugCandidate, locale } });
        if (post) return { kind: "post" as const, post, locale };

        // 4) Konektum event slug at root -> public registration page.
        if (locale === "es") {
          const konEvent = await resolveKonEvent({ data: { slug: slugCandidate } });
          if (konEvent) {
            throw redirect({
              to: "/$eventSlug/registro",
              params: { eventSlug: konEvent.slug || slugCandidate },
            });
          }
        }
      }


      // Fall back to redirect lookup
      const { to } = await lookupRedirect({ data: { path: pathname } });
      if (to) throw redirect({ href: to, statusCode: 301, reloadDocument: true });
    } catch (e) {
      // Re-throw redirects so TanStack handles them.
      if (e instanceof Response) throw e;
      if (e && typeof e === "object" && "isRedirect" in (e as object)) throw e;
      console.error("[$.tsx] catch-all loader failed", e);

    }

    return { kind: "not-found" as const, path: pathname };
  },
  head: ({ loaderData }) => {
    if (loaderData?.kind === "post") {
      const p = loaderData.post;
      const loc = loaderData.locale;
      const title = p.seo_title || p.title;
      const desc = (p.meta_description || p.excerpt || stripTagsForMeta(p.content)).slice(0, 160);
      const path = loc === "es" ? `/${p.slug}` : `/${loc}/${p.slug}`;
      const url = `https://kleff.es${path}`;
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: desc,
        image: p.cover_image_url ? [p.cover_image_url] : undefined,
        datePublished: p.published_at,
        author: p.author_name ? { "@type": "Person", name: p.author_name } : { "@type": "Organization", name: "KLEFF" },
        publisher: { "@type": "Organization", name: "KLEFF", logo: { "@type": "ImageObject", url: "https://kleff.es/favicon.ico" } },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: loc === "es" ? "es-ES" : loc === "ca" ? "ca-ES" : "en-GB",
      };
      return {
        meta: [
          { title: `${title} — KLEFF` },
          { name: "description", content: desc },
          ...(p.keywords && p.keywords.length ? [{ name: "keywords", content: p.keywords.join(", ") }] : []),
          { property: "og:title", content: title },
          { property: "og:description", content: desc },
          { property: "og:type", content: "article" },
          { property: "og:url", content: url },
          ...(p.cover_image_url ? [{ property: "og:image", content: p.cover_image_url }] : []),
          { name: "twitter:card", content: p.cover_image_url ? "summary_large_image" : "summary" },
          { property: "article:published_time", content: p.published_at },
        ],
        links: [{ rel: "canonical", href: url }],
        scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
      };
    }

    if (loaderData?.kind === "custom") {
      return {
        meta: [
          { title: `${loaderData.page.title} — KLEFF` },
          { property: "og:title", content: loaderData.page.title },
        ],
      };
    }
    if (loaderData?.kind === "registration") {
      const f = loaderData.form;
      const desc = (f.description ?? "Inscripción KLEFF").slice(0, 160);
      return {
        meta: [
          { title: `${f.title} — KLEFF` },
          { name: "description", content: desc },
          { property: "og:title", content: f.title },
          { property: "og:description", content: desc },
          ...(f.cover_image_url ? [{ property: "og:image", content: f.cover_image_url }] : []),
        ],
      };
    }
    return {
      meta: [
        { title: "Página no encontrada — KLEFF" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: CatchAll,
});

function CatchAll() {
  const data = Route.useLoaderData();
  if (data.kind === "post") {
    return <BlogPostPage post={data.post} />;
  }
  if (data.kind === "custom") {
    return <CustomPage title={data.page.title} blocks={data.blocks} />;
  }
  if (data.kind === "registration") {
    return <PublicRegistrationPage form={data.form} questions={data.questions} responsesCount={data.responsesCount} />;
  }
  return <NotFound path={data.path} />;
}


function NotFound({ path }: { path: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No hemos encontrado <code className="font-mono">{path}</code>.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function isPlausibleSlug(s: string) {
  // WordPress slugs are lowercase letters, digits and hyphens.
  return /^[a-z0-9][a-z0-9-]{1,200}$/.test(s);
}

function stripTagsForMeta(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
