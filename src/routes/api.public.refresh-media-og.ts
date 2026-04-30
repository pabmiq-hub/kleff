import { createFileRoute } from "@tanstack/react-router";
import { PRESS_LINKS } from "@/data/press";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

type OgFields = {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogSiteName: string | null;
};

const EMPTY_OG: OgFields = {
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  ogSiteName: null,
};

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
      body: JSON.stringify({ url, formats: ["html"], onlyMainContent: false }),
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
  const meta: Record<string, unknown> = json.data?.metadata ?? {};
  const html: string = typeof json.data?.html === "string" ? json.data.html : "";
  const pickHtml = (name: string) => {
    const m = html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
        "i",
      ),
    );
    return m ? m[1] : null;
  };
  return {
    ogTitle:
      readMeta(meta, "og:title", "ogTitle", "twitter:title", "title") ??
      pickHtml("og:title") ??
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null),
    ogDescription:
      readMeta(meta, "og:description", "ogDescription", "description") ??
      pickHtml("og:description") ??
      pickHtml("description"),
    ogImage:
      readMeta(meta, "og:image", "ogImage", "twitter:image") ??
      pickHtml("og:image") ??
      pickHtml("twitter:image"),
    ogSiteName:
      readMeta(meta, "og:site_name", "ogSiteName") ?? pickHtml("og:site_name"),
  };
}

async function refreshAll(force: boolean) {
  let scraped = 0;
  let skipped = 0;
  const errors: string[] = [];

  // If not forcing, only refresh URLs missing from cache.
  let urlsToRefresh = PRESS_LINKS.map((p) => p.url);
  if (!force) {
    const { data } = await supabaseAdmin
      .from("media_og_cache" as any)
      .select("url")
      .in("url", urlsToRefresh);
    const existing = new Set(((data ?? []) as any[]).map((r) => r.url as string));
    urlsToRefresh = urlsToRefresh.filter((u) => !existing.has(u));
    skipped = PRESS_LINKS.length - urlsToRefresh.length;
  }

  for (const url of urlsToRefresh) {
    try {
      const og = await fetchOg(url);
      const { error } = await supabaseAdmin.from("media_og_cache" as any).upsert(
        {
          url,
          og_title: og.ogTitle,
          og_description: og.ogDescription,
          og_image: og.ogImage,
          og_site_name: og.ogSiteName,
          fetched_at: new Date().toISOString(),
          error: null,
        },
        { onConflict: "url" },
      );
      if (error) errors.push(`${url}: ${error.message}`);
      else scraped++;
    } catch (err) {
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { total: PRESS_LINKS.length, scraped, skipped, errors };
}

export const Route = createFileRoute("/api/public/refresh-media-og")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MEDIA_REFRESH_TOKEN;
        if (token) {
          const auth = request.headers.get("authorization");
          if (auth !== `Bearer ${token}`) {
            return new Response("Unauthorized", { status: 401 });
          }
        }
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";
        try {
          const result = await refreshAll(force);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[refresh-media-og] failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
      GET: async ({ request }) => {
        const token = process.env.MEDIA_REFRESH_TOKEN;
        if (token) return new Response("Use POST with Bearer token", { status: 405 });
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";
        try {
          const result = await refreshAll(force);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, error: msg }, { status: 500 });
        }
      },
    },
  },
});
