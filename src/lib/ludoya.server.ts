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

export async function listLudoyaMatches(): Promise<{ matches: LudoyaMatch[]; endpointOk: boolean; lastError?: string }> {
  try {
    const q = new URLSearchParams({ pagination: "50,0" });
    const res = await ludoyaFetch(`/events?${q.toString()}`);
    if (res.ok) {
      const json = (await res.json()) as any;
      const raw: any[] =
        json?.futureEvents?.elements
        ?? json?.events?.elements
        ?? json?.elements
        ?? (Array.isArray(json) ? json : []);
      const parentRef = (e: any) => {
        const p = e.parentEvent ?? e.parent ?? null;
        const pid = e.parentEventId ?? p?.id ?? null;
        if (!pid) return null;
        return { id: pid, title: p?.title ?? null };
      };
      const matches: LudoyaMatch[] = raw.map((e) => ({
        id: e.id,
        type: (e.type ?? "MEETUP") as LudoyaEventType,
        title: e.title ?? null,
        scheduledAt: e.startsAt ?? e.scheduledAt ?? null,
        endsAt: e.endsAt ?? null,
        location: e.location ?? e.venue?.name ?? null,
        notes: e.description ?? e.notes ?? null,
        minPlayers: e.minPlayerCount ?? e.minPlayers ?? null,
        maxPlayers: e.maxPlayerCount ?? e.maxPlayers ?? null,
        capacity: typeof e.capacity === "number" ? e.capacity : null,
        participantCount: typeof e.participantCount === "number" ? e.participantCount : null,
        imageUrl: e.imageUrl ?? null,
        boardgame: e.boardgame
          ? {
              id: e.boardgame.id,
              slug: e.boardgame.slug,
              name: e.boardgame.name,
              imageUrl: e.boardgame.imageUrl ?? null,
            }
          : null,
        participants: Array.isArray(e.participants) ? e.participants : null,
        parentEvent: parentRef(e),
        url: e.url ?? (e.id ? `https://app.ludoya.com/events/${e.id}` : null),
      }));
      return { matches, endpointOk: true };
    }
    let msg = `HTTP ${res.status}`;
    try { msg = ((await res.json()) as { message?: string }).message ?? msg; } catch { /* ignore */ }
    return { matches: [], endpointOk: false, lastError: `/events: ${msg}` };
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

