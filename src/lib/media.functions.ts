import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";
// Cache de seguidores de Instagram: 6 horas.
const FOLLOWERS_REFRESH_MS = 6 * 60 * 60 * 1000;

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

// ---------------------------------------------------------------------------
// Instagram posts (Behold feed) — persistent cache, 1h refresh
// ---------------------------------------------------------------------------

const IG_POSTS_KEY = "instagram_posts_behold";
const IG_POSTS_REFRESH_MS = 60 * 60 * 1000; // 1 hour
const BEHOLD_FEED_ID = "JLKUC5Sj5crxsZw3Gt2N";
const BEHOLD_ENDPOINT = `https://feeds.behold.so/${BEHOLD_FEED_ID}`;

export type InstagramPost = {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  thumbnailUrl: string;
  caption: string;
  timestamp: string;
};

async function fetchBeholdPosts(): Promise<InstagramPost[]> {
  try {
    const res = await fetch(BEHOLD_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[media] behold fetch non-ok", res.status);
      return [];
    }
    const json: any = await res.json();
    const raw = Array.isArray(json?.posts) ? json.posts : [];
    const posts: InstagramPost[] = raw.map((p: any) => {
      const sizes = p?.sizes ?? {};
      const thumb =
        sizes.medium?.mediaUrl ??
        sizes.small?.mediaUrl ??
        sizes.large?.mediaUrl ??
        p?.mediaUrl ??
        "";
      return {
        id: String(p?.id ?? ""),
        permalink: String(p?.permalink ?? ""),
        mediaType: (p?.mediaType ?? "IMAGE") as InstagramPost["mediaType"],
        thumbnailUrl: thumb,
        caption: typeof p?.prunedCaption === "string"
          ? p.prunedCaption
          : typeof p?.caption === "string"
            ? p.caption
            : "",
        timestamp: String(p?.timestamp ?? ""),
      };
    });
    // Newest first by timestamp (defensive — Behold already returns newest first).
    posts.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
    return posts.slice(0, 9);
  } catch (err) {
    console.error("[media] behold fetch failed", err);
    return [];
  }
}

async function loadIgPostsCache(): Promise<{ posts: InstagramPost[]; fetchedAt: number } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("kv_cache" as any)
      .select("value, fetched_at")
      .eq("key", IG_POSTS_KEY)
      .maybeSingle();
    if (error || !data) return null;
    const value = (data as any).value;
    const posts: InstagramPost[] = Array.isArray(value?.posts) ? value.posts : [];
    return {
      posts,
      fetchedAt: new Date((data as any).fetched_at).getTime(),
    };
  } catch {
    return null;
  }
}

async function saveIgPostsCache(posts: InstagramPost[]) {
  try {
    await supabaseAdmin.from("kv_cache" as any).upsert(
      {
        key: IG_POSTS_KEY,
        value: { posts } as any,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  } catch (err) {
    console.error("[media] saveIgPostsCache error", err);
  }
}

function scheduleIgPostsRefresh() {
  const work = (async () => {
    const posts = await fetchBeholdPosts();
    if (posts.length > 0) await saveIgPostsCache(posts);
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

export const getInstagramPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<InstagramPost[]> => {
    const cached = await loadIgPostsCache();
    const now = Date.now();

    if (cached && cached.posts.length > 0) {
      const age = now - cached.fetchedAt;
      if (age > IG_POSTS_REFRESH_MS) scheduleIgPostsRefresh();
      return cached.posts;
    }

    // No cache yet — fetch synchronously the first time so the UI has content immediately.
    const posts = await fetchBeholdPosts();
    if (posts.length > 0) await saveIgPostsCache(posts);
    return posts;
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
