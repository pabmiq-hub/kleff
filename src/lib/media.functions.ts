import { createServerFn } from "@tanstack/react-start";
import { PRESS_LINKS, type PressLink } from "@/data/press";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MediaItem = PressLink & {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
// Refresca como mucho una vez cada 30 días por URL.
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
// Cache de seguidores de Instagram: 6 horas.
const FOLLOWERS_REFRESH_MS = 6 * 60 * 60 * 1000;

type OgFields = Omit<MediaItem, keyof PressLink>;

const EMPTY_OG: OgFields = {
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  ogSiteName: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readMeta(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  }
  return null;
}

async function fetchOgFromFirecrawl(url: string): Promise<OgFields> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return EMPTY_OG;

  let res: Response;
  try {
    res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        onlyMainContent: false,
      }),
    });
  } catch {
    return EMPTY_OG;
  }

  if (!res.ok) return EMPTY_OG;

  let json: any;
  try {
    json = await res.json();
  } catch {
    return EMPTY_OG;
  }

  if (!json?.success) return EMPTY_OG;

  const data = json.data ?? {};
  const meta: Record<string, unknown> = data.metadata ?? {};
  const html: string = typeof data.html === "string" ? data.html : "";

  const pickHtml = (name: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return m[1];
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    );
    const m2 = html.match(re2);
    return m2 ? m2[1] : null;
  };

  return {
    ogTitle:
      readMeta(meta, "og:title", "ogTitle", "twitter:title", "title") ??
      pickHtml("og:title") ??
      pickHtml("twitter:title") ??
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null),
    ogDescription:
      readMeta(meta, "og:description", "ogDescription", "twitter:description", "description") ??
      pickHtml("og:description") ??
      pickHtml("twitter:description") ??
      pickHtml("description"),
    ogImage:
      readMeta(meta, "og:image", "ogImage", "twitter:image", "image") ??
      pickHtml("og:image") ??
      pickHtml("twitter:image"),
    ogSiteName:
      readMeta(meta, "og:site_name", "ogSiteName") ?? pickHtml("og:site_name"),
  };
}

// ---------------------------------------------------------------------------
// Persistent cache (Postgres)
// ---------------------------------------------------------------------------

type CacheRow = {
  url: string;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
  fetched_at: string;
  error: string | null;
};

async function loadCache(urls: string[]): Promise<Map<string, CacheRow>> {
  const out = new Map<string, CacheRow>();
  if (urls.length === 0) return out;
  try {
    const { data, error } = await supabaseAdmin
      .from("media_og_cache" as any)
      .select("*")
      .in("url", urls);
    if (error) {
      console.error("[media] loadCache error", error);
      return out;
    }
    for (const row of (data ?? []) as unknown as CacheRow[]) {
      out.set(row.url, row);
    }
  } catch (err) {
    console.error("[media] loadCache exception", err);
  }
  return out;
}

async function upsertCache(url: string, og: OgFields, error: string | null = null) {
  try {
    const { error: dbErr } = await supabaseAdmin.from("media_og_cache" as any).upsert(
      {
        url,
        og_title: og.ogTitle,
        og_description: og.ogDescription,
        og_image: og.ogImage,
        og_site_name: og.ogSiteName,
        fetched_at: new Date().toISOString(),
        error,
      },
      { onConflict: "url" },
    );
    if (dbErr) console.error("[media] upsertCache error", dbErr);
  } catch (err) {
    console.error("[media] upsertCache exception", err);
  }
}

/**
 * Fire-and-forget background scrape: writes the result to the DB cache when done.
 * Uses waitUntil if the runtime exposes it, otherwise a plain unawaited promise.
 */
function scheduleBackgroundRefresh(urls: string[]) {
  if (urls.length === 0) return;
  const work = (async () => {
    for (const url of urls) {
      try {
        const og = await fetchOgFromFirecrawl(url);
        await upsertCache(url, og, null);
      } catch (err) {
        console.error("[media] background scrape failed for", url, err);
        await upsertCache(url, EMPTY_OG, err instanceof Error ? err.message : "unknown");
      }
    }
  })();
  const wu = (globalThis as any).waitUntil;
  if (typeof wu === "function") {
    try {
      wu(work);
    } catch {
      // ignore — promise already running
    }
  }
}

// ---------------------------------------------------------------------------
// Public server function
// ---------------------------------------------------------------------------

export const getMediaItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaItem[]> => {
    const sorted = [...PRESS_LINKS].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    // URLs that need OG enrichment (skip those with manual imageOverride only? they still
    // benefit from OG title/description, so we cache all of them).
    const urls = sorted.map((l) => l.url);
    const cache = await loadCache(urls);

    const now = Date.now();
    const stale: string[] = [];

    const items: MediaItem[] = sorted.map((link) => {
      const row = cache.get(link.url);
      if (!row) {
        stale.push(link.url);
        return { ...link, ...EMPTY_OG };
      }
      const age = now - new Date(row.fetched_at).getTime();
      if (age > REFRESH_AFTER_MS) stale.push(link.url);
      return {
        ...link,
        ogTitle: row.og_title,
        ogDescription: row.og_description,
        ogImage: row.og_image,
        ogSiteName: row.og_site_name,
      };
    });

    // Refresh missing/stale entries in the background — never block the response.
    scheduleBackgroundRefresh(stale);

    return items;
  },
);

// ---------------------------------------------------------------------------
// Instagram followers — persistent cache
// ---------------------------------------------------------------------------

const FOLLOWERS_KEY = "instagram_followers";

type FollowersValue = { count: number | null };

async function loadFollowersCache(): Promise<{ value: FollowersValue; fetchedAt: number } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("kv_cache" as any)
      .select("value, fetched_at")
      .eq("key", FOLLOWERS_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return {
      value: (data as any).value as FollowersValue,
      fetchedAt: new Date((data as any).fetched_at).getTime(),
    };
  } catch {
    return null;
  }
}

async function saveFollowersCache(count: number | null) {
  try {
    await supabaseAdmin.from("kv_cache" as any).upsert(
      {
        key: FOLLOWERS_KEY,
        value: { count } as any,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  } catch (err) {
    console.error("[media] saveFollowersCache error", err);
  }
}

async function scrapeFollowers(): Promise<number | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://www.instagram.com/kleff.bcn/",
        formats: ["html"],
        onlyMainContent: false,
      }),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json?.success) return null;

    const meta: Record<string, unknown> = json.data?.metadata ?? {};
    const html: string = typeof json.data?.html === "string" ? json.data.html : "";

    const description =
      readMeta(meta, "og:description", "ogDescription", "description") ??
      html.match(
        /<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ??
      "";

    if (!description) return null;

    const m = description.match(
      /([\d.,]+\s*[KMkm]?)\s*(?:Followers|seguidores|seguidors|Seguidores|Seguidors|followers)/i,
    );
    if (!m) return null;

    let raw = m[1].trim().replace(/\s+/g, "");
    let multiplier = 1;
    if (/k$/i.test(raw)) {
      multiplier = 1000;
      raw = raw.slice(0, -1);
    } else if (/m$/i.test(raw)) {
      multiplier = 1_000_000;
      raw = raw.slice(0, -1);
    }
    const normalized = raw.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const num = Number.parseFloat(normalized);
    if (!Number.isFinite(num)) return null;
    return Math.round(num * multiplier);
  } catch (err) {
    console.error("[media] followers scrape failed", err);
    return null;
  }
}

function scheduleFollowersRefresh() {
  const work = (async () => {
    const count = await scrapeFollowers();
    if (count !== null) await saveFollowersCache(count);
  })();
  const wu = (globalThis as any).waitUntil;
  if (typeof wu === "function") {
    try {
      wu(work);
    } catch {
      // ignore
    }
  }
}

export const getInstagramFollowers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ count: number | null; updatedAt: string }> => {
    const cached = await loadFollowersCache();
    const now = Date.now();

    if (cached) {
      const age = now - cached.fetchedAt;
      if (age > FOLLOWERS_REFRESH_MS) scheduleFollowersRefresh();
      return {
        count: cached.value?.count ?? null,
        updatedAt: new Date(cached.fetchedAt).toISOString(),
      };
    }

    // No cache yet — schedule a refresh and return a placeholder so the page still loads fast.
    scheduleFollowersRefresh();
    return { count: null, updatedAt: new Date(now).toISOString() };
  },
);

// ============================================================================
// Media uploads — admin only, stores files in the public `media` bucket.
// ============================================================================

import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertSuperAdmin } from "@/lib/assert-role.server";

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      fileName: z.string().min(1).max(255),
      contentType: z.string().min(1).max(128),
      base64: z.string().min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    // Preserve the original filename for SEO ("blood-on-the-clocktower.jpg"
    // stays meaningful) but slugify minimally and append a short random suffix
    // so two uploads with the same name don't collide.
    //
    // Examples:
    //   "Blood On The Clocktower.JPG"  -> "blood-on-the-clocktower-a1b2c3.jpg"
    //   "logo.png"                      -> "logo-7f8e9d.png"
    //   "imagen áéí.webp"               -> "imagen-aei-1q2w3e.webp"
    const rawName = data.fileName.trim();
    const lastDot = rawName.lastIndexOf(".");
    const baseRaw = lastDot > 0 ? rawName.slice(0, lastDot) : rawName;
    const extRaw = lastDot > 0 ? rawName.slice(lastDot + 1) : "";

    const slugify = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

    const baseSlug = slugify(baseRaw) || "file";
    const ext = (extRaw || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    const suffix = Math.random().toString(36).slice(2, 8);
    const finalName = `${baseSlug}-${suffix}.${ext}`;
    const path = `cms/${finalName}`;

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });

    if (error) throw new Error(error.message);

    const { data: pub } = supabaseAdmin.storage.from("media").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });
