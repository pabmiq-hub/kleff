import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";


export type MeetupEvent = {
  id: string;
  title: string;
  url: string;
  dateTime: string; // ISO with offset
  endTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  imageUrl: string | null;
  going: number | null;
};

export type MeetupGroupStats = {
  memberCount: number | null;
  upcomingEventCount: number | null;
  rating: number | null;
  ratingCount: number | null;
};

export type GoogleStats = {
  rating: number | null;
  ratingCount: number | null;
};

type CacheData = {
  events: MeetupEvent[];
  stats: MeetupGroupStats;
  google: GoogleStats;
};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h — serve from kv_cache without re-fetching
const FIRECRAWL_COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000; // 10 days
const CACHE_KEY = "meetup_data";
const FIRECRAWL_LOCK_KEY = "meetup_firecrawl_lock";

async function loadKvCache(): Promise<{ data: CacheData; at: number } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("kv_cache" as any)
      .select("value, fetched_at")
      .eq("key", CACHE_KEY)
      .maybeSingle();
    if (error || !data) return null;
    return {
      data: (data as any).value as CacheData,
      at: new Date((data as any).fetched_at).getTime(),
    };
  } catch {
    return null;
  }
}

async function saveKvCache(data: CacheData): Promise<void> {
  try {
    await supabaseAdmin.from("kv_cache" as any).upsert(
      { key: CACHE_KEY, value: data as any, fetched_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  } catch (err) {
    console.error("[meetup] saveKvCache error", err);
  }
}

async function loadFirecrawlLockAt(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("kv_cache" as any)
      .select("fetched_at")
      .eq("key", FIRECRAWL_LOCK_KEY)
      .maybeSingle();
    if (!data) return 0;
    return new Date((data as any).fetched_at).getTime();
  } catch {
    return 0;
  }
}

async function bumpFirecrawlLock(): Promise<void> {
  try {
    await supabaseAdmin.from("kv_cache" as any).upsert(
      { key: FIRECRAWL_LOCK_KEY, value: {} as any, fetched_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  } catch {
    // ignore
  }
}


const GROUP_URL = "https://www.meetup.com/es-es/kleff-bcn/events/";
const GROUP_HOME_URL = "https://www.meetup.com/es-es/kleff-bcn/";
// Google search results expose the knowledge panel for KLEFF, including rating
// and review count, without requiring login (the Maps page itself hides them).
const GOOGLE_SEARCH_URL =
  "https://www.google.com/search?q=KLEFF+Barcelona+juegos+de+mesa&hl=es";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

// ----------------------------------------------------------------------------
// HTML helpers
// ----------------------------------------------------------------------------

function extractApolloState(html: string): Record<string, any> | null {
  const marker = '"__APOLLO_STATE__":';
  const i = html.indexOf(marker);
  if (i === -1) return null;
  const start = html.indexOf("{", i);
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let j = start; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = j + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  const raw = html.slice(start, end);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function refToObj(state: Record<string, any>, ref: any): any {
  if (!ref) return null;
  if (typeof ref === "object" && ref.__ref) return state[ref.__ref] ?? null;
  return ref;
}

// ----------------------------------------------------------------------------
// Fetchers
// ----------------------------------------------------------------------------

async function fetchHtmlDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchHtmlFirecrawl(url: string): Promise<string | null> {
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
        url,
        formats: ["html"],
        onlyMainContent: false,
      }),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!json?.success) return null;
    const html = json?.data?.html;
    return typeof html === "string" ? html : null;
  } catch {
    return null;
  }
}

async function fetchHtmlDirectOk(url: string): Promise<string | null> {
  const direct = await fetchHtmlDirect(url);
  if (direct && direct.length > 5000) return direct;
  return null;
}


// ----------------------------------------------------------------------------
// Parse Meetup
// ----------------------------------------------------------------------------

function parseMeetupGroup(html: string): {
  events: MeetupEvent[];
  stats: MeetupGroupStats;
} {
  const stats: MeetupGroupStats = {
    memberCount: null,
    upcomingEventCount: null,
    rating: null,
    ratingCount: null,
  };

  const state = extractApolloState(html);
  if (state) {
    for (const key of Object.keys(state)) {
      if (key.startsWith("Group:")) {
        const g: any = state[key];
        if (!g) continue;
        if (typeof g.memberships === "number") stats.memberCount = g.memberships;
        if (typeof g.totalMemberships === "number") stats.memberCount = g.totalMemberships;
        if (typeof g.upcomingEvents?.count === "number")
          stats.upcomingEventCount = g.upcomingEvents.count;
        if (typeof g.averageRating === "number") stats.rating = g.averageRating;
        if (typeof g.totalRatings === "number") stats.ratingCount = g.totalRatings;
      }
    }
  }

  // HTML fallbacks
  if (stats.memberCount == null) {
    const m = html.match(/([\d.,\s]{2,12})\s*(?:miembros|members|membres)/i);
    if (m) {
      const n = parseInt(m[1].replace(/[.,\s]/g, ""), 10);
      if (!Number.isNaN(n)) stats.memberCount = n;
    }
  }
  if (stats.rating == null) {
    // Match "4.8" possibly followed by markup, then "2700 valoraciones".
    // Allow up to 400 chars between (HTML wrappers, classes, links, …).
    const m = html.match(
      /(\d[.,]\d)[\s\S]{0,400}?(\d[\d.,]{0,8})\s*(?:valoraciones|ratings|valoracions)/i,
    );
    if (m) {
      stats.rating = parseFloat(m[1].replace(",", "."));
      const n = parseInt(m[2].replace(/[.,]/g, ""), 10);
      if (!Number.isNaN(n)) stats.ratingCount = n;
    } else {
      const m2 = html.match(/(\d[.,]\d)\s*\/?\s*5/);
      if (m2) stats.rating = parseFloat(m2[1].replace(",", "."));
      const m3 = html.match(/(\d[\d.,]{0,8})\s*(?:valoraciones|ratings|valoracions)/i);
      if (m3) {
        const n = parseInt(m3[1].replace(/[.,]/g, ""), 10);
        if (!Number.isNaN(n)) stats.ratingCount = n;
      }
    }
  }

  const events: MeetupEvent[] = [];
  if (state) {
    const now = Date.now();
    for (const key of Object.keys(state)) {
      if (!key.startsWith("Event:")) continue;
      const e = state[key];
      if (!e || e.status !== "ACTIVE") continue;
      const dateTime: string | undefined = e.dateTime;
      if (!dateTime) continue;
      const t = new Date(dateTime).getTime();
      if (Number.isNaN(t) || t < now - 2 * 60 * 60 * 1000) continue;

      const venue = refToObj(state, e.venue);
      const photo =
        refToObj(state, e.featuredEventPhoto) || refToObj(state, e.displayPhoto);

      events.push({
        id: String(e.id),
        title: e.title ?? "",
        url: e.eventUrl ?? GROUP_URL,
        dateTime,
        endTime: e.endTime ?? null,
        venueName: venue?.name ?? null,
        venueAddress: venue?.address ?? null,
        venueCity: venue?.city ?? null,
        imageUrl: photo?.highResUrl ?? photo?.baseUrl ?? null,
        going: typeof e.going === "number" ? e.going : null,
      });
    }
    events.sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );
  }
  if (stats.upcomingEventCount == null) stats.upcomingEventCount = events.length;
  return { events, stats };
}

// ----------------------------------------------------------------------------
// Parse Google
// ----------------------------------------------------------------------------

function parseGoogleStats(html: string): GoogleStats {
  const out: GoogleStats = { rating: null, ratingCount: null };

  // Patterns observed on Google Maps share/place pages:
  //   "4.9 stars 1,234 Reviews"
  //   "4,9 estrellas 1.234 reseñas"
  //   aria-label "4.9 stars 1234 reviews"
  //   meta name="description" content="★★★★★ · 4,9 (1.234)"
  //   "rating":"4.9","userRatingCount":"1234"
  const jsonRating = html.match(/"rating"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/i);
  const jsonCount = html.match(
    /"(?:userRatingCount|reviewCount|ratingsCount)"\s*:\s*"?(\d[\d,.]*)"?/i,
  );
  if (jsonRating) out.rating = parseFloat(jsonRating[1].replace(",", "."));
  if (jsonCount) {
    const n = parseInt(jsonCount[1].replace(/[.,]/g, ""), 10);
    if (!Number.isNaN(n)) out.ratingCount = n;
  }

  if (out.rating == null) {
    const m = html.match(
      /(\d[.,]\d)\s*(?:stars?|estrellas?|estrelles?|\/\s*5|de\s*5)/i,
    );
    if (m) out.rating = parseFloat(m[1].replace(",", "."));
  }
  if (out.ratingCount == null) {
    const m = html.match(
      /(\d[\d.,]*)\s*(?:reviews?|reseñas|ressenyes|opiniones|opinions)/i,
    );
    if (m) {
      const n = parseInt(m[1].replace(/[.,]/g, ""), 10);
      if (!Number.isNaN(n)) out.ratingCount = n;
    }
  }
  // Pattern from Google search: "5.0[170 opiniones" / "5,0 · 170 reseñas"
  if (out.rating == null && out.ratingCount != null) {
    const m = html.match(
      /(\d[.,]\d)[^\d]{0,8}\d[\d.,]*\s*(?:reviews?|reseñas|opiniones)/i,
    );
    if (m) out.rating = parseFloat(m[1].replace(",", "."));
  }
  // Pattern: "★★★★★ · 4,9 (1.234)" common in Google's meta description
  if (out.rating == null || out.ratingCount == null) {
    const m = html.match(/(\d[.,]\d)\s*\(\s*([\d.,]+)\s*\)/);
    if (m) {
      if (out.rating == null) out.rating = parseFloat(m[1].replace(",", "."));
      if (out.ratingCount == null) {
        const n = parseInt(m[2].replace(/[.,]/g, ""), 10);
        if (!Number.isNaN(n)) out.ratingCount = n;
      }
    }
  }

  return out;
}

// ----------------------------------------------------------------------------
// Combined fetch
// ----------------------------------------------------------------------------

async function fetchAll(): Promise<CacheData> {
  // Meetup events (events page) + group home (better stats) in parallel
  const [eventsHtml, homeHtml, googleHtml] = await Promise.all([
    fetchHtml(GROUP_URL),
    fetchHtml(GROUP_HOME_URL),
    fetchHtml(GOOGLE_SEARCH_URL),
  ]);

  let events: MeetupEvent[] = [];
  let stats: MeetupGroupStats = {
    memberCount: null,
    upcomingEventCount: null,
    rating: null,
    ratingCount: null,
  };

  if (eventsHtml) {
    const parsed = parseMeetupGroup(eventsHtml);
    events = parsed.events;
    stats = parsed.stats;
  }
  if (homeHtml) {
    const parsed = parseMeetupGroup(homeHtml);
    // Prefer home page stats when available (richer)
    if (parsed.stats.memberCount != null) stats.memberCount = parsed.stats.memberCount;
    if (parsed.stats.rating != null) stats.rating = parsed.stats.rating;
    if (parsed.stats.ratingCount != null) stats.ratingCount = parsed.stats.ratingCount;
    if (events.length === 0) events = parsed.events;
  }

  const google: GoogleStats = googleHtml
    ? parseGoogleStats(googleHtml)
    : { rating: null, ratingCount: null };

  return { events, stats, google };
}

// ----------------------------------------------------------------------------
// Server function
// ----------------------------------------------------------------------------

export const getMeetupEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    events: MeetupEvent[];
    stats: MeetupGroupStats;
    google: GoogleStats;
    error: string | null;
    cachedAt: number;
  }> => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      return {
        events: cache.data.events,
        stats: cache.data.stats,
        google: cache.data.google,
        error: null,
        cachedAt: cache.at,
      };
    }
    try {
      const data = await fetchAll();
      cache = { at: now, data };
      return {
        events: data.events,
        stats: data.stats,
        google: data.google,
        error: null,
        cachedAt: now,
      };
    } catch (err) {
      console.error("[meetup] fetch failed:", err);
      if (cache) {
        return {
          events: cache.data.events,
          stats: cache.data.stats,
          google: cache.data.google,
          error: "stale",
          cachedAt: cache.at,
        };
      }
      return {
        events: [],
        stats: { memberCount: null, upcomingEventCount: null, rating: null, ratingCount: null },
        google: { rating: null, ratingCount: null },
        error: err instanceof Error ? err.message : "unknown",
        cachedAt: now,
      };
    }
  },
);
