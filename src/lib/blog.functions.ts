import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertSuperAdmin } from "@/lib/assert-role.server";
import { sanitizeHtml } from "@/lib/sanitize.server";

const LOCALES = ["es", "ca", "en"] as const;
type Locale = (typeof LOCALES)[number];
const localeSchema = z.enum(LOCALES);

export interface BlogPostSummary {
  id: string;
  slug: string;
  published_at: string;
  cover_image_url: string | null;
  author_name: string | null;
  title: string;
  excerpt: string;
}

export interface BlogPostFull extends BlogPostSummary {
  content: string;
  translationMissing: boolean;
}

// ---------------------------------------------------------------------------
// PUBLIC reads
// ---------------------------------------------------------------------------

export const listBlogPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ locale: localeSchema.default("es") }))
  .handler(async ({ data }): Promise<{ posts: BlogPostSummary[] }> => {
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select(
        "id, slug, published_at, cover_image_url, author_name, title_es, title_ca, title_en, excerpt_es, excerpt_ca, excerpt_en",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("listBlogPosts error", error);
      return { posts: [] };
    }

    const posts: BlogPostSummary[] = (rows ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      published_at: r.published_at,
      cover_image_url: r.cover_image_url,
      author_name: r.author_name,
      title: pickLocaleString(data.locale, r.title_es, r.title_ca, r.title_en),
      excerpt: pickLocaleString(data.locale, r.excerpt_es, r.excerpt_ca, r.excerpt_en),
    }));
    return { posts };
  });

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(255), locale: localeSchema.default("es") }))
  .handler(async ({ data }): Promise<{ post: BlogPostFull | null }> => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("getBlogPostBySlug error", error);
      return { post: null };
    }
    if (!row) return { post: null };

    const titleInLocale = pickLocaleStringStrict(data.locale, row.title_es, row.title_ca, row.title_en);
    const excerptInLocale = pickLocaleStringStrict(data.locale, row.excerpt_es, row.excerpt_ca, row.excerpt_en);
    const contentInLocale = pickLocaleStringStrict(data.locale, row.content_es, row.content_ca, row.content_en);
    const translationMissing = !titleInLocale || !contentInLocale;

    return {
      post: {
        id: row.id,
        slug: row.slug,
        published_at: row.published_at,
        cover_image_url: row.cover_image_url,
        author_name: row.author_name,
        title: titleInLocale ?? row.title_en ?? row.title_es ?? row.title_ca ?? row.slug,
        excerpt: excerptInLocale ?? row.excerpt_en ?? row.excerpt_es ?? row.excerpt_ca ?? "",
        content: contentInLocale ?? row.content_en ?? row.content_es ?? row.content_ca ?? "",
        translationMissing,
      },
    };
  });

export const listBlogSlugsForSitemap = createServerFn({ method: "GET" }).handler(async () => {
  const { data: rows } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return { posts: rows ?? [] };
});

// ---------------------------------------------------------------------------
// ADMIN: list (includes drafts and translation status)
// ---------------------------------------------------------------------------

export interface AdminBlogPostRow {
  id: string;
  wp_id: number | null;
  slug: string;
  status: string;
  published_at: string;
  cover_image_url: string | null;
  author_name: string | null;
  title_en: string | null;
  hasEs: boolean;
  hasCa: boolean;
}

export const adminListBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ posts: AdminBlogPostRow[] }> => {
    await assertSuperAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select(
        "id, wp_id, slug, status, published_at, cover_image_url, author_name, title_en, title_es, title_ca, content_en, content_es, content_ca",
      )
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      posts: (rows ?? []).map((r) => ({
        id: r.id,
        wp_id: r.wp_id,
        slug: r.slug,
        status: r.status,
        published_at: r.published_at,
        cover_image_url: r.cover_image_url,
        author_name: r.author_name,
        title_en: r.title_en,
        hasEs: !!(r.title_es && r.content_es),
        hasCa: !!(r.title_ca && r.content_ca),
      })),
    };
  });

// ---------------------------------------------------------------------------
// ADMIN: import from WordPress
// ---------------------------------------------------------------------------

const DEFAULT_WP = "https://kleff.es";

export const adminImportWordPress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      baseUrl: z.string().url().default(DEFAULT_WP),
      perPage: z.number().int().min(1).max(100).default(100),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.claims?.email) {
      // ok — only super_admins should call this. Defensive double-check via RLS-allowed query
    }

    // We only allow super_admins to run this — confirm by trying to read user_roles
    const { data: roleRows, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleErr) throw new Error(roleErr.message);
    const isSuperAdmin = (roleRows ?? []).some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      throw new Error("Solo super-administradores pueden importar desde WordPress.");
    }

    const allPosts: WPPost[] = [];
    let page = 1;
    // Fetch all pages (37 posts → 1 page at per_page=100)
    while (true) {
      const url = `${data.baseUrl}/wp-json/wp/v2/posts?per_page=${data.perPage}&page=${page}&_embed=wp:featuredmedia,author`;
      const res = await fetch(url);
      if (!res.ok) {
        if (page === 1) throw new Error(`WordPress API error: ${res.status}`);
        break;
      }
      const batch = (await res.json()) as WPPost[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      allPosts.push(...batch);
      const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1");
      if (page >= totalPages) break;
      page++;
    }

    let imported = 0;
    let skipped = 0;
    for (const p of allPosts) {
      try {
        await upsertWordPressPost(p);
        imported++;
      } catch (e) {
        console.error("[blog] import failed for wp post", p.id, e);
        skipped++;
      }
    }

    return { total: allPosts.length, imported, skipped };
  });

interface WPPost {
  id: number;
  date: string;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
    author?: Array<{ name?: string }>;
  };
}

async function upsertWordPressPost(p: WPPost) {
  const cover = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
  const author = p._embedded?.author?.[0]?.name ?? null;

  // Sanitize: WP renders titles with HTML entities — decode them
  const titleEn = decodeEntities(stripTags(p.title.rendered)).trim();
  const excerptEn = decodeEntities(stripTags(p.excerpt.rendered)).trim().slice(0, 500);
  const contentEn = sanitizeHtml(p.content.rendered);

  const slug = p.slug;

  await supabaseAdmin
    .from("blog_posts")
    .upsert(
      {
        wp_id: p.id,
        slug,
        status: p.status === "publish" ? "published" : "draft",
        published_at: p.date,
        author_name: author,
        cover_image_url: cover,
        title_en: titleEn,
        excerpt_en: excerptEn,
        content_en: contentEn,
      },
      { onConflict: "wp_id" },
    );
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "");
}
function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ");
}

// ---------------------------------------------------------------------------
// ADMIN: translate one post (EN → ES + CA)
// ---------------------------------------------------------------------------

export const adminTranslateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), force: z.boolean().default(false) }))
  .handler(async ({ data, context }) => {
    // super_admin check
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!(roleRows ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("Solo super-administradores pueden traducir posts.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Post no encontrado");
    if (!row.title_en || !row.content_en) throw new Error("El post no tiene contenido en inglés para traducir");

    const updates: {
      title_es?: string;
      excerpt_es?: string;
      content_es?: string;
      title_ca?: string;
      excerpt_ca?: string;
      content_ca?: string;
    } = {};

    if (data.force || !row.title_es || !row.content_es) {
      const es = await translatePost(
        { title: row.title_en, excerpt: row.excerpt_en ?? "", content: row.content_en },
        "Spanish (Spain, castellano)",
      );
      if (es) {
        updates.title_es = es.title;
        updates.excerpt_es = es.excerpt;
        updates.content_es = es.content;
      }
    }
    if (data.force || !row.title_ca || !row.content_ca) {
      const ca = await translatePost(
        { title: row.title_en, excerpt: row.excerpt_en ?? "", content: row.content_en },
        "Catalan (Català)",
      );
      if (ca) {
        updates.title_ca = ca.title;
        updates.excerpt_ca = ca.excerpt;
        updates.content_ca = ca.content;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabaseAdmin.from("blog_posts").update(updates).eq("id", data.id);
      if (updErr) throw new Error(updErr.message);
    }

    return { ok: true, fieldsUpdated: Object.keys(updates).length };
  });

async function translatePost(
  src: { title: string; excerpt: string; content: string },
  targetLanguage: string,
): Promise<{ title: string; excerpt: string; content: string } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[blog] LOVABLE_API_KEY missing");
    return null;
  }

  const system =
    `You translate KLEFF blog posts (a Barcelona board games community) from English to ${targetLanguage}. ` +
    `Return a single JSON object with keys "title", "excerpt", "content". ` +
    `Rules: ` +
    `- Translate naturally and idiomatically. Keep the warm, energetic, community tone. ` +
    `- The "content" field is HTML. Preserve ALL HTML tags, attributes, classes, ids, data-* attributes EXACTLY. Only translate user-visible text inside tags. ` +
    `- Preserve <a href="..."> URLs untouched. ` +
    `- Do NOT translate: brand names (KLEFF, BoardGameGeek, Meetup, WhatsApp, Catan, Wingspan, etc.), proper nouns, place names. ` +
    `- Do NOT translate game titles (e.g. "Blood on the Clocktower", "Misma Mente", "Quorum") — keep them as-is. ` +
    `- Preserve emojis, numbers, dates. ` +
    `- Respond ONLY with the JSON object. No markdown fence, no commentary.`;

  const user = JSON.stringify(src);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    console.error(`[blog] AI gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as { title?: string; excerpt?: string; content?: string };
    if (!parsed.title || !parsed.content) return null;
    return {
      title: parsed.title,
      excerpt: parsed.excerpt ?? "",
      content: parsed.content,
    };
  } catch (e) {
    console.error("[blog] AI returned invalid JSON", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// ADMIN: mirror external images (kleff.es) into our own storage bucket
// ---------------------------------------------------------------------------

export const adminMirrorBlogImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!(roleRows ?? []).some((r) => r.role === "super_admin")) {
      throw new Error("Solo super-administradores pueden rehospedar imágenes.");
    }

    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id, slug, cover_image_url, content_en, content_es, content_ca");
    if (error) throw new Error(error.message);

    const cache = new Map<string, string>(); // src URL -> new URL
    let covers = 0;
    let inline = 0;
    let failed = 0;

    const isExternal = (u: string | null) =>
      !!u && /^https?:\/\/(www\.)?kleff\.es\//i.test(u);

    const mirror = async (src: string, slugHint: string): Promise<string | null> => {
      const cached = cache.get(src);
      if (cached) return cached;
      try {
        const res = await fetch(src);
        if (!res.ok) {
          failed++;
          return null;
        }
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
        const buf = new Uint8Array(await res.arrayBuffer());
        // derive a stable filename from the URL basename + slug
        const baseName = src.split("/").pop()?.split("?")[0]?.replace(/\.[a-z0-9]+$/i, "") ?? "img";
        const safe = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "img";
        const suffix = Math.random().toString(36).slice(2, 8);
        const path = `blog/${slugHint}/${safe}-${suffix}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from("media")
          .upload(path, buf, { contentType: ct, upsert: false });
        if (upErr) {
          failed++;
          return null;
        }
        const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path);
        cache.set(src, pub.publicUrl);
        return pub.publicUrl;
      } catch {
        failed++;
        return null;
      }
    };

    const rewriteHtml = async (html: string | null, slug: string): Promise<{ out: string | null; changed: boolean; count: number }> => {
      if (!html) return { out: html, changed: false, count: 0 };
      const matches = [...html.matchAll(/https?:\/\/(?:www\.)?kleff\.es\/[^\s"'<>)]+\.(?:jpe?g|png|gif|webp)/gi)];
      if (matches.length === 0) return { out: html, changed: false, count: 0 };
      let out = html;
      let n = 0;
      for (const m of matches) {
        const orig = m[0];
        // replace each unique URL once
        if (!cache.has(orig)) {
          const next = await mirror(orig, slug);
          if (!next) continue;
        }
        const next = cache.get(orig);
        if (!next) continue;
        // global replace of this exact string
        out = out.split(orig).join(next);
        n++;
      }
      return { out, changed: n > 0, count: n };
    };

    for (const row of rows ?? []) {
      const updates: {
        cover_image_url?: string;
        content_en?: string;
        content_es?: string;
        content_ca?: string;
      } = {};

      if (isExternal(row.cover_image_url)) {
        const next = await mirror(row.cover_image_url as string, row.slug);
        if (next) {
          updates.cover_image_url = next;
          covers++;
        }
      }

      const en = await rewriteHtml(row.content_en, row.slug);
      if (en.changed && en.out) {
        updates.content_en = en.out;
        inline += en.count;
      }
      const es = await rewriteHtml(row.content_es, row.slug);
      if (es.changed && es.out) {
        updates.content_es = es.out;
        inline += es.count;
      }
      const ca = await rewriteHtml(row.content_ca, row.slug);
      if (ca.changed && ca.out) {
        updates.content_ca = ca.out;
        inline += ca.count;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updErr } = await supabaseAdmin
          .from("blog_posts")
          .update(updates)
          .eq("id", row.id);
        if (updErr) console.error("[blog] mirror update failed", row.slug, updErr);
      }
    }

    return { covers, inline, failed };
  });

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function pickLocaleString(locale: Locale, es: string | null, ca: string | null, en: string | null): string {
  const v = locale === "es" ? es : locale === "ca" ? ca : en;
  return (v && v.trim() !== "" ? v : null) ?? es ?? en ?? ca ?? "";
}
function pickLocaleStringStrict(
  locale: Locale,
  es: string | null,
  ca: string | null,
  en: string | null,
): string | null {
  const v = locale === "es" ? es : locale === "ca" ? ca : en;
  return v && v.trim() !== "" ? v : null;
}

// ---------------------------------------------------------------------------
// ADMIN: create / update / get / delete posts (rich text editor)
// ---------------------------------------------------------------------------

export const adminGetBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return { post: row };
  });

export const adminCreateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    title_es: z.string().min(1).max(300),
  }))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        slug: data.slug,
        title_es: data.title_es,
        status: "draft",
        published_at: new Date().toISOString(),
      } as never)
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const adminUpdateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    id: z.string().uuid(),
    patch: z.object({
      slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
      status: z.enum(["draft", "published"]).optional(),
      published_at: z.string().optional(),
      cover_image_url: z.string().url().nullable().optional(),
      author_name: z.string().max(200).nullable().optional(),
      title_es: z.string().max(300).nullable().optional(),
      title_ca: z.string().max(300).nullable().optional(),
      title_en: z.string().max(300).nullable().optional(),
      excerpt_es: z.string().max(2000).nullable().optional(),
      excerpt_ca: z.string().max(2000).nullable().optional(),
      excerpt_en: z.string().max(2000).nullable().optional(),
      content_es: z.string().max(200000).nullable().optional(),
      content_ca: z.string().max(200000).nullable().optional(),
      content_en: z.string().max(200000).nullable().optional(),
      tags: z.array(z.string().max(50)).max(20).optional(),
      reading_time_minutes: z.number().int().min(0).max(240).nullable().optional(),
    }),
  }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("blog_posts").update(data.patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
