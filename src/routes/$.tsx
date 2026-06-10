import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { lookupRedirect } from "@/lib/redirects.functions";
import { getBlogPostBySlug } from "@/lib/blog.functions";
import { BlogPostPage } from "@/components/pages/BlogPostPage";
import { resolveCustomPage, getPageBlocks } from "@/lib/blocks.functions";
import { CustomPage } from "@/components/pages/CustomPage";

type Locale = "es" | "ca" | "en";

/**
 * Catch-all route. Handles, in order:
 *  1. Locale-prefixed or root single-segment blog post slugs (matching the
 *     original WordPress URLs: /{slug}, /en/{slug}, /ca/{slug}).
 *  2. CMS custom pages (content_pages with slug_es/ca/en).
 *  3. 301 redirects stored in `content_redirects`.
 *  4. 404 page.
 */
export const Route = createFileRoute("/$")({
  loader: async ({ location }) => {
    const pathname = location.pathname;
    const trimmed = pathname.replace(/\/+$/, "");
    const segments = trimmed.split("/").filter(Boolean);

    // Try to interpret as a single-segment slug (blog post or custom page)
    let locale: Locale = "es";
    let slugCandidate: string | null = null;

    if (segments.length === 1) {
      slugCandidate = segments[0];
    } else if (segments.length === 2 && (segments[0] === "en" || segments[0] === "ca")) {
      locale = segments[0] as Locale;
      slugCandidate = segments[1];
    }

    // Wrap backend lookups so a transient DB / SSR error never bubbles up as
    // a hard 500 on the catch-all — fall through to a friendly 404 instead.
    try {
      if (slugCandidate && isPlausibleSlug(slugCandidate)) {
        // 1) Custom CMS page first (admin-created pages take priority over blog posts).
        const { page } = await resolveCustomPage({ data: { slug: slugCandidate, locale } });
        if (page && page.is_published) {
          const { blocks } = await getPageBlocks({ data: { pageId: page.id, locale } });
          return { kind: "custom" as const, page, blocks, locale };
        }
        // 2) Blog post (WordPress slug).
        const { post } = await getBlogPostBySlug({ data: { slug: slugCandidate, locale } });
        if (post) return { kind: "post" as const, post, locale };
      }

      // Fall back to redirect lookup
      const { to } = await lookupRedirect({ data: { path: pathname } });
      if (to) throw redirect({ href: to, statusCode: 301, reloadDocument: true });
    } catch (e) {
      // Re-throw redirects so TanStack handles them.
      if (e && typeof e === "object" && "isRedirect" in (e as object)) throw e;
      console.error("[$.tsx] catch-all loader failed", e);
    }

    return { kind: "not-found" as const, path: pathname };
  },
  head: ({ loaderData }) => {
    if (loaderData?.kind === "post") {
      const p = loaderData.post;
      const desc = (p.excerpt || stripTagsForMeta(p.content)).slice(0, 160);
      return {
        meta: [
          { title: `${p.title} — KLEFF` },
          { name: "description", content: desc },
          { property: "og:title", content: p.title },
          { property: "og:description", content: desc },
          { property: "og:type", content: "article" },
          ...(p.cover_image_url ? [{ property: "og:image", content: p.cover_image_url }] : []),
          { property: "article:published_time", content: p.published_at },
        ],
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
