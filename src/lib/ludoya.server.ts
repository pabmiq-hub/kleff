// Server-only helper for the Ludoya public API (KLEFF group).
// All calls go through the group API key stored as LUDOYA_API_KEY.

const BASE = "https://api.ludoya.com/public/v1";

function apiKey(): string {
  const k = process.env.LUDOYA_API_KEY;
  if (!k) throw new Error("LUDOYA_API_KEY no configurada");
  return k;
}

async function ludoyaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Api-Key", apiKey());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${BASE}${path}`, { ...init, headers });
}

export interface LudoyaUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export async function searchLudoyaUsers(query: string, size = 20, page = 0): Promise<LudoyaUser[]> {
  const q = new URLSearchParams({ query, pagination: `${size},${page}` });
  const res = await ludoyaFetch(`/search/users?${q.toString()}`);
  if (!res.ok) throw new Error(`Ludoya search error (${res.status})`);
  const json = (await res.json()) as { users?: { elements?: LudoyaUser[] } };
  return json.users?.elements ?? [];
}

export async function findLudoyaUserByUsername(username: string): Promise<LudoyaUser | null> {
  const target = username.trim().toLowerCase();
  if (!target) return null;
  const results = await searchLudoyaUsers(target, 20, 0);
  return results.find((u) => u.username.toLowerCase() === target) ?? null;
}

export interface InviteResult {
  status: "invited" | "not_found" | "already" | "error";
  httpStatus: number;
  message?: string;
}

export async function inviteToKleffGroup(username: string): Promise<InviteResult> {
  const res = await ludoyaFetch(`/members/invite`, {
    method: "POST",
    body: JSON.stringify({ username: username.trim() }),
  });
  if (res.status === 201 || res.status === 204) return { status: "invited", httpStatus: res.status };
  if (res.status === 404) return { status: "not_found", httpStatus: 404 };
  if (res.status === 409) return { status: "already", httpStatus: 409 };
  let message: string | undefined;
  try { message = ((await res.json()) as { message?: string }).message; } catch { /* ignore */ }
  return { status: "error", httpStatus: res.status, message };
}

export interface LudoyaBoardgame {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  isExpansion: boolean;
  yearPublished: number | null;
  minPlayerCount: number | null;
  maxPlayerCount: number | null;
}

export async function searchLudoyaBoardgames(query: string, size = 30, page = 0): Promise<LudoyaBoardgame[]> {
  const q = new URLSearchParams({ query, pagination: `${size},${page}` });
  const res = await ludoyaFetch(`/search/boardgames?${q.toString()}`);
  if (!res.ok) throw new Error(`Ludoya boardgame search error (${res.status})`);
  const json = (await res.json()) as { games?: { elements?: LudoyaBoardgame[] } };
  return json.games?.elements ?? [];
}

// -------- Matches (partidas) --------
// NOTE: Endpoint paths are best-effort until Ludoya publishes the official docs.
// We try a few candidates and fall back gracefully so the UI keeps working.

export type LudoyaEventType = "MEETUP" | "PLANNED_PLAY" | "TOURNAMENT" | string;

export interface LudoyaMatch {
  id: string;
  type: LudoyaEventType;
  title?: string | null;
  scheduledAt?: string | null; // ISO date
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  capacity?: number | null;
  participantCount?: number | null;
  imageUrl?: string | null;
  boardgame?: {
    id?: string;
    slug?: string;
    name?: string;
    imageUrl?: string | null;
  } | null;
  createdBy?: { id?: string; username?: string; name?: string } | null;
  participants?: Array<{ id?: string; username?: string; name?: string }> | null;
  parentEvent?: { id: string; title?: string | null } | null;
  url?: string | null;
}

const EVENT_TYPE = "PLANNED_PLAY";

function mapRawEvent(e: any, parent?: { id: string; title?: string | null } | null): LudoyaMatch {
  const p = parent ?? (e.parentEvent
    ? { id: e.parentEvent.id, title: e.parentEvent.title ?? null }
    : e.parentEventId
      ? { id: e.parentEventId, title: null }
      : e.parentId
        ? { id: e.parentId, title: null }
        : null);
  const game = e.boardgame ?? e.game ?? null;
  const loc = typeof e.location === "string"
    ? e.location
    : (e.location?.name ?? e.venue?.name ?? null);
  return {
    id: e.id,
    type: (e.type ?? "MEETUP") as LudoyaEventType,
    title: e.title ?? null,
    scheduledAt: e.startsAt ?? e.scheduledAt ?? null,
    endsAt: e.endsAt ?? null,
    location: loc,
    notes: e.description ?? e.notes ?? null,
    minPlayers: e.minPlayerCount ?? e.minPlayers ?? e.minParticipants ?? null,
    maxPlayers: e.maxPlayerCount ?? e.maxPlayers ?? null,
    capacity: typeof e.capacity === "number" ? e.capacity : null,
    participantCount: typeof e.participantCount === "number" ? e.participantCount : null,
    imageUrl: e.imageUrl ?? e.image?.url ?? null,
    boardgame: game
      ? {
          id: game.id,
          slug: game.slug,
          name: game.name,
          imageUrl: game.imageUrl ?? null,
        }
      : null,
    participants: Array.isArray(e.participants) ? e.participants : null,
    parentEvent: p,
    url: e.url ?? (e.id ? `https://app.ludoya.com/events/${e.id}` : null),
  };
}

async function fetchEventChildren(eventId: string): Promise<any[]> {
  // The /public/v1/events/{id}/children endpoint isn't exposed, but the
  // internal /events/{id}/children accepts the group API key and returns
  // TOURNAMENT + PLANNED_PLAY items scheduled inside a parent event.
  // NOTE: sub-MEETUP children with visibility "ONLY_GROUP" are filtered out
  // by the API when called with a group API key (they only render for
  // signed-in members). To surface partidas nested inside such sub-meetups
  // we recurse when a child reports childEventCount > 0.
  try {
    const res = await fetch(`https://api.ludoya.com/events/${eventId}/children`, {
      headers: { "X-Api-Key": apiKey() },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as any;
    const list: any[] = json?.list ?? json?.elements ?? (Array.isArray(json) ? json : []);
    return list;
  } catch {
    return [];
  }
}

async function fetchEvent(eventId: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.ludoya.com/events/${eventId}`, {
      headers: { "X-Api-Key": apiKey() },
    });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

function extraParentIds(): string[] {
  const raw = process.env.LUDOYA_EXTRA_PARENT_EVENT_IDS ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function listLudoyaMatches(): Promise<{ matches: LudoyaMatch[]; endpointOk: boolean; lastError?: string }> {
  try {
    const q = new URLSearchParams({ pagination: "100,0" });
    const res = await ludoyaFetch(`/events?${q.toString()}`);
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = ((await res.json()) as { message?: string }).message ?? msg; } catch { /* ignore */ }
      return { matches: [], endpointOk: false, lastError: `/events: ${msg}` };
    }
    const json = (await res.json()) as any;
    const raw: any[] =
      json?.futureEvents?.elements
      ?? json?.events?.elements
      ?? json?.elements
      ?? (Array.isArray(json) ? json : []);

    // Include manually-configured extra parent event IDs (e.g. sub-meetups
    // with "Solo grupo" visibility that the listing endpoint hides).
    const extras = await Promise.all(extraParentIds().map((id) => fetchEvent(id)));
    for (const e of extras) if (e && !raw.some((r) => r.id === e.id)) raw.push(e);

    const parents = raw.map((e) => mapRawEvent(e));

    // Recursively fetch children (depth up to 2) so we surface partidas /
    // torneos that live inside a sub-MEETUP.
    const visited = new Set<string>();
    async function collectChildren(parentEvt: any, depth: number): Promise<LudoyaMatch[]> {
      if (depth > 4 || !parentEvt?.id || visited.has(parentEvt.id)) return [];
      visited.add(parentEvt.id);
      const items = await fetchEventChildren(parentEvt.id);
      const parentRef = { id: parentEvt.id, title: parentEvt.title ?? null };
      const mapped = items.map((c) => mapRawEvent(c, parentRef));
      const nested = await Promise.all(
        items
          .filter((c) => (c?.childEventCount ?? 0) > 0)
          .map((c) => collectChildren(c, depth + 1)),
      );
      return [...mapped, ...nested.flat()];
    }

    const childLists = await Promise.all(raw.map((e) => collectChildren(e, 1)));

    const seen = new Set<string>();
    const all: LudoyaMatch[] = [];
    for (const m of [...parents, ...childLists.flat()]) {
      if (!m.id || seen.has(m.id)) continue;
      seen.add(m.id);
      all.push(m);
    }

    // Only surface upcoming activity. An item is "future" when its endsAt is
    // still ahead (multi-day events) or, if no end date, when its scheduledAt
    // hasn't passed yet. Items without any date are kept (treated as pending).
    const now = Date.now();
    const matches = all.filter((m) => {
      const endMs = m.endsAt ? Date.parse(m.endsAt) : NaN;
      if (!Number.isNaN(endMs)) return endMs >= now;
      const startMs = m.scheduledAt ? Date.parse(m.scheduledAt) : NaN;
      if (!Number.isNaN(startMs)) return startMs >= now;
      return true;
    });

    // Backfill parent titles now that we know every event's title, and use
    // parentId (Ludoya's canonical field) to keep the hierarchy consistent
    // regardless of which endpoint returned each item.
    const titleById = new Map(matches.map((m) => [m.id, m.title ?? null]));
    for (const m of matches) {
      if (m.parentEvent && !m.parentEvent.title) {
        const t = titleById.get(m.parentEvent.id);
        if (t) m.parentEvent = { ...m.parentEvent, title: t };
      }
    }
    return { matches, endpointOk: true };
  } catch (e) {
    return { matches: [], endpointOk: false, lastError: e instanceof Error ? e.message : String(e) };
  }
}



export interface CreateLudoyaMatchInput {
  title: string;
  scheduledAt: string; // ISO
  boardgameId?: string | null;
  boardgameSlug?: string | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  location?: string | null;
  notes?: string | null;
  hostUsername?: string | null;
}

export async function createLudoyaMatch(input: CreateLudoyaMatchInput): Promise<{ ok: boolean; match?: LudoyaMatch; httpStatus: number; message?: string }> {
  const body = {
    type: EVENT_TYPE,
    title: input.title,
    scheduledAt: input.scheduledAt,
    boardgameId: input.boardgameId ?? undefined,
    boardgameSlug: input.boardgameSlug ?? undefined,
    minPlayers: input.minPlayers ?? undefined,
    maxPlayers: input.maxPlayers ?? undefined,
    location: input.location ?? undefined,
    notes: input.notes ?? undefined,
    hostUsername: input.hostUsername ?? undefined,
  };
  const res = await ludoyaFetch(`/events`, { method: "POST", body: JSON.stringify(body) });
  if (res.ok || res.status === 201) {
    let match: LudoyaMatch | undefined;
    try { match = (await res.json()) as LudoyaMatch; } catch { /* ignore */ }
    return { ok: true, match, httpStatus: res.status };
  }
  let message: string | undefined;
  try { message = ((await res.json()) as { message?: string }).message; } catch { /* ignore */ }
  return { ok: false, httpStatus: res.status, message: message ?? "No se pudo crear la partida en Ludoya" };
}

