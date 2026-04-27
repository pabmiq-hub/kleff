import { createServerFn } from "@tanstack/react-start";
import { PRESS_LINKS, type PressLink } from "@/data/press";

export type MediaItem = PressLink & {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

type OgFields = Omit<MediaItem, keyof PressLink>;
type CacheEntry = { at: number; data: OgFields };
const cache = new Map<string, CacheEntry>();

const EMPTY_OG: OgFields = {
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  ogSiteName: null,
};

/**
 * Read a metadata field tolerating multiple Firecrawl naming conventions:
 *   - "og:image" (raw OG namespace, what v2 actually returns)
 *   - "ogImage" (camelCased alias)
 *   - "twitter:image"
 */
function readMeta(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  }
  return null;
}

async function fetchOg(url: string): Promise<OgFields> {
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

  // Fallback: parse meta tags directly from HTML if metadata key is missing.
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

export const getMediaItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaItem[]> => {
    const sorted = [...PRESS_LINKS].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Use Promise.allSettled so a single failing scrape never breaks the page.
    const results = await Promise.allSettled(
      sorted.map(async (link) => {
        // If the link already has a manual image override, skip the network call entirely.
        if (link.imageOverride) {
          return { ...link, ...EMPTY_OG };
        }
        const now = Date.now();
        const hit = cache.get(link.url);
        if (hit && now - hit.at < CACHE_TTL_MS) {
          return { ...link, ...hit.data };
        }
        try {
          const og = await fetchOg(link.url);
          cache.set(link.url, { at: now, data: og });
          return { ...link, ...og };
        } catch (err) {
          console.error("[media] og fetch failed for", link.url, err);
          return { ...link, ...EMPTY_OG };
        }
      }),
    );

    return results.map((r, i) =>
      r.status === "fulfilled" ? r.value : { ...sorted[i], ...EMPTY_OG },
    );
  },
);

// ============================================================================
// Instagram followers — cached for 1 hour
// ============================================================================

type FollowerCache = { at: number; count: number | null };
let followersCache: FollowerCache = { at: 0, count: null };
const FOLLOWERS_TTL_MS = 60 * 60 * 1000; // 1 hour

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

    // Instagram exposes follower count in og:description like:
    //   "10,3K Followers, 234 Following, 1,2K Posts - ..."
    const description =
      readMeta(meta, "og:description", "ogDescription", "description") ??
      html.match(
        /<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      )?.[1] ??
      "";

    if (!description) return null;

    // Match "10,3K Followers" or "10.3K seguidores" or "10300 followers"
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
    // Spanish/Catalan use "," as decimal separator, English uses "." — normalize both.
    const normalized = raw.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    const num = Number.parseFloat(normalized);
    if (!Number.isFinite(num)) return null;
    return Math.round(num * multiplier);
  } catch (err) {
    console.error("[media] followers scrape failed", err);
    return null;
  }
}

export const getInstagramFollowers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ count: number | null; updatedAt: string }> => {
    const now = Date.now();
    if (followersCache.count !== null && now - followersCache.at < FOLLOWERS_TTL_MS) {
      return {
        count: followersCache.count,
        updatedAt: new Date(followersCache.at).toISOString(),
      };
    }
    const count = await scrapeFollowers();
    if (count !== null) {
      followersCache = { at: now, count };
    } else if (followersCache.count !== null) {
      // Keep last known good value if scrape failed.
      return {
        count: followersCache.count,
        updatedAt: new Date(followersCache.at).toISOString(),
      };
    }
    return {
      count,
      updatedAt: new Date(now).toISOString(),
    };
  },
);
