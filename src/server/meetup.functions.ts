import { createServerFn } from "@tanstack/react-start";

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

type CacheData = { events: MeetupEvent[]; stats: MeetupGroupStats };
type CacheEntry = { at: number; data: CacheData };
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
let cache: CacheEntry | null = null;

const GROUP_URL = "https://www.meetup.com/es-es/kleff-bcn/events/";

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

async function fetchAndParse(): Promise<CacheData> {
  const res = await fetch(GROUP_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KleffBot/1.0; +https://kleff.es)",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Meetup responded ${res.status}`);
  const html = await res.text();
  const state = extractApolloState(html);

  // Parse group stats from HTML (visible text fallback) and Apollo state when available
  const stats: MeetupGroupStats = {
    memberCount: null,
    upcomingEventCount: null,
    rating: null,
    ratingCount: null,
  };

  // Try to find member count from Apollo state first
  if (state) {
    for (const key of Object.keys(state)) {
      if (key.startsWith("Group:")) {
        const g: any = state[key];
        if (g) {
          if (typeof g.memberships === "number") stats.memberCount = g.memberships;
          if (typeof g.totalMemberships === "number") stats.memberCount = g.totalMemberships;
          if (typeof g.upcomingEvents?.count === "number") stats.upcomingEventCount = g.upcomingEvents.count;
          if (typeof g.averageRating === "number") stats.rating = g.averageRating;
          if (typeof g.totalRatings === "number") stats.ratingCount = g.totalRatings;
        }
      }
    }
  }

  // HTML fallback for member count: "13.071 miembros" / "13,071 members" / "13071 membres"
  if (stats.memberCount == null) {
    const m = html.match(/([\d.,\s]{2,12})\s*(?:miembros|members|membres)/i);
    if (m) {
      const n = parseInt(m[1].replace(/[.,\s]/g, ""), 10);
      if (!Number.isNaN(n)) stats.memberCount = n;
    }
  }
  // Rating fallback: "4.8" before "valoraciones/ratings/valoracions"
  if (stats.rating == null) {
    const m = html.match(/(\d\.\d)\s*•\s*\[?(\d[\d.,]*)\s*(?:valoraciones|ratings|valoracions)/i);
    if (m) {
      stats.rating = parseFloat(m[1]);
      const n = parseInt(m[2].replace(/[.,]/g, ""), 10);
      if (!Number.isNaN(n)) stats.ratingCount = n;
    }
  }

  if (!state) return { events: [], stats };

  const events: MeetupEvent[] = [];
  const now = Date.now();
  for (const key of Object.keys(state)) {
    if (!key.startsWith("Event:")) continue;
    const e = state[key];
    if (!e || e.status !== "ACTIVE") continue;
    const dateTime: string | undefined = e.dateTime;
    if (!dateTime) continue;
    // Skip past events
    const t = new Date(dateTime).getTime();
    if (Number.isNaN(t) || t < now - 2 * 60 * 60 * 1000) continue;

    const venue = refToObj(state, e.venue);
    const photo = refToObj(state, e.featuredEventPhoto) || refToObj(state, e.displayPhoto);

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
  events.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  if (stats.upcomingEventCount == null) stats.upcomingEventCount = events.length;
  return { events, stats };
}

export const getMeetupEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    events: MeetupEvent[];
    stats: MeetupGroupStats;
    error: string | null;
    cachedAt: number;
  }> => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      return { events: cache.data.events, stats: cache.data.stats, error: null, cachedAt: cache.at };
    }
    try {
      const data = await fetchAndParse();
      cache = { at: now, data };
      return { events: data.events, stats: data.stats, error: null, cachedAt: now };
    } catch (err) {
      console.error("[meetup] fetch failed:", err);
      // Serve stale if we have it
      if (cache) {
        return {
          events: cache.data.events,
          stats: cache.data.stats,
          error: "stale",
          cachedAt: cache.at,
        };
      }
      return {
        events: [],
        stats: { memberCount: null, upcomingEventCount: null, rating: null, ratingCount: null },
        error: err instanceof Error ? err.message : "unknown",
        cachedAt: now,
      };
    }
  },
);

