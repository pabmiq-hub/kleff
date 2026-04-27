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

async function fetchAndParse(): Promise<MeetupEvent[]> {
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
  if (!state) return [];

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
  return events;
}

export const getMeetupEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ events: MeetupEvent[]; error: string | null; cachedAt: number }> => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      return { events: cache.data, error: null, cachedAt: cache.at };
    }
    try {
      const data = await fetchAndParse();
      cache = { at: now, data };
      return { events: data, error: null, cachedAt: now };
    } catch (err) {
      console.error("[meetup] fetch failed:", err);
      // Serve stale if we have it
      if (cache) {
        return {
          events: cache.data,
          error: "stale",
          cachedAt: cache.at,
        };
      }
      return {
        events: [],
        error: err instanceof Error ? err.message : "unknown",
        cachedAt: now,
      };
    }
  },
);
