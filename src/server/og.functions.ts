import { createServerFn } from "@tanstack/react-start";

export type OgPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

type CacheEntry = { at: number; data: OgPreview };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const cache = new Map<string, CacheEntry>();

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

async function scrapeWithFirecrawl(url: string): Promise<OgPreview> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
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
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Firecrawl ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data?: { html?: string; metadata?: any } };
  const html = json.data?.html ?? "";
  const meta = json.data?.metadata ?? {};

  const pick = (name: string) => {
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

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  return {
    url,
    title:
      meta.ogTitle ?? pick("og:title") ?? pick("twitter:title") ?? meta.title ?? (titleTag ? titleTag[1] : null),
    description:
      meta.ogDescription ?? pick("og:description") ?? pick("twitter:description") ?? meta.description ?? pick("description"),
    image: meta.ogImage ?? pick("og:image") ?? pick("twitter:image") ?? null,
    siteName: meta.ogSiteName ?? pick("og:site_name") ?? null,
  };
}

export const getOgPreview = createServerFn({ method: "GET" })
  .inputValidator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<OgPreview> => {
    const url = data.url;
    const now = Date.now();
    const hit = cache.get(url);
    if (hit && now - hit.at < CACHE_TTL_MS) return hit.data;
    try {
      const preview = await scrapeWithFirecrawl(url);
      cache.set(url, { at: now, data: preview });
      return preview;
    } catch (err) {
      console.error("[og] failed:", err);
      const fallback: OgPreview = {
        url,
        title: null,
        description: null,
        image: null,
        siteName: null,
      };
      return fallback;
    }
  });

export const getOgPreviews = createServerFn({ method: "GET" })
  .inputValidator((data: { urls: string[] }) => data)
  .handler(async ({ data }): Promise<OgPreview[]> => {
    const results = await Promise.all(
      data.urls.map(async (url) => {
        const now = Date.now();
        const hit = cache.get(url);
        if (hit && now - hit.at < CACHE_TTL_MS) return hit.data;
        try {
          const preview = await scrapeWithFirecrawl(url);
          cache.set(url, { at: now, data: preview });
          return preview;
        } catch (err) {
          console.error("[og] failed for", url, err);
          return { url, title: null, description: null, image: null, siteName: null } as OgPreview;
        }
      }),
    );
    return results;
  });
