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

type CacheEntry = { at: number; data: Omit<MediaItem, keyof PressLink> };
const cache = new Map<string, CacheEntry>();

async function fetchOg(url: string): Promise<Omit<MediaItem, keyof PressLink>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { ogTitle: null, ogDescription: null, ogImage: null, ogSiteName: null };
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
    return { ogTitle: null, ogDescription: null, ogImage: null, ogSiteName: null };
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
    ogTitle:
      meta.ogTitle ?? pick("og:title") ?? pick("twitter:title") ?? meta.title ?? (titleTag ? titleTag[1] : null),
    ogDescription:
      meta.ogDescription ?? pick("og:description") ?? pick("twitter:description") ?? meta.description ?? pick("description"),
    ogImage: meta.ogImage ?? pick("og:image") ?? pick("twitter:image") ?? null,
    ogSiteName: meta.ogSiteName ?? pick("og:site_name") ?? null,
  };
}

export const getMediaItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaItem[]> => {
    const sorted = [...PRESS_LINKS].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    const items = await Promise.all(
      sorted.map(async (link) => {
        const now = Date.now();
        const hit = cache.get(link.url);
        let og: Omit<MediaItem, keyof PressLink>;
        if (hit && now - hit.at < CACHE_TTL_MS) {
          og = hit.data;
        } else {
          try {
            og = await fetchOg(link.url);
            cache.set(link.url, { at: now, data: og });
          } catch (err) {
            console.error("[media] og fetch failed for", link.url, err);
            og = { ogTitle: null, ogDescription: null, ogImage: null, ogSiteName: null };
          }
        }
        return { ...link, ...og };
      }),
    );

    return items;
  },
);
