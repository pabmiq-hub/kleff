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
  // Ludoya currently exposes children from the public group endpoint as
  // `{ children: [...] }`. Older/internal endpoints return `{ list: [...] }`,
  // so keep both shapes as fallbacks.
  const paths = [
    `${BASE}/events/${eventId}/children?pagination=100,0`,
    `https://api.ludoya.com/events/${eventId}/children?pagination=100,0`,
  ];

  for (const url of paths) {
    try {
      const res = await fetch(url, { headers: { "X-Api-Key": apiKey() } });
      if (!res.ok) continue;
      const json = (await res.json()) as any;
      const list: any[] = json?.children ?? json?.list ?? json?.elements ?? (Array.isArray(json) ? json : []);
      if (list.length > 0) return list;
    } catch {
      // Try the next known endpoint shape.
    }
  }

  return [];
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
      const nested = await Promise.all(items.map((c) => collectChildren(c, depth + 1)));
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
  parentId?: string | null;
}

export async function createLudoyaMatch(input: CreateLudoyaMatchInput): Promise<{ ok: boolean; match?: LudoyaMatch; httpStatus: number; message?: string }> {
  // Resolve the host (master) so the creator appears as narrador/anfitrión
  // and is also signed up as a participant.
  let masterUserId: string | null = null;
  if (input.hostUsername) {
    try {
      const host = await findLudoyaUserByUsername(input.hostUsername);
      masterUserId = host?.id ?? null;
    } catch {
      masterUserId = null;
    }
  }

  const startsAt = new Date(input.scheduledAt);
  const startsAtIso = Number.isNaN(startsAt.getTime()) ? null : startsAt.toISOString();
  if (!startsAtIso) return { ok: false, httpStatus: 400, message: "Fecha no válida" };

  // Ludoya has no location/notes fields on events: they live in `description`.
  const descriptionParts = [input.notes?.trim(), input.location?.trim() ? `📍 ${input.location.trim()}` : null]
    .filter(Boolean);

  const body: Record<string, unknown> = {
    type: EVENT_TYPE,
    title: input.title,
    startsAt: startsAtIso,
    timeZone: "Europe/Madrid",
    ...(descriptionParts.length ? { description: descriptionParts.join("\n\n") } : {}),
    ...(input.maxPlayers ? { capacity: input.maxPlayers } : {}),
    ...(input.boardgameId ? { gameId: input.boardgameId } : {}),
    ...(masterUserId ? { masterUserId } : {}),
    ...(input.parentId ? { parentEventId: input.parentId } : {}),
  };

  const res = await ludoyaFetch(`/events`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok && res.status !== 201) {
    let message: string | undefined;
    try { message = ((await res.json()) as { message?: string }).message; } catch { /* ignore */ }
    return { ok: false, httpStatus: res.status, message: message ?? "No se pudo crear la partida en Ludoya" };
  }

  let createdId: string | null = null;
  try { createdId = ((await res.json()) as { id?: string }).id ?? null; } catch { /* ignore */ }

  // Sign the creator up as participant (Ludoya doesn't do it automatically).
  if (createdId && masterUserId) {
    try {
      await ludoyaFetch(`/events/${createdId}/participants`, {
        method: "POST",
        body: JSON.stringify({ userId: masterUserId }),
      });
    } catch { /* non-fatal */ }
  }

  let match: LudoyaMatch | undefined;
  if (createdId) {
    const raw = await fetchEvent(createdId);
    if (raw) match = mapRawEvent(raw);
    else match = { id: createdId, type: EVENT_TYPE, title: input.title, scheduledAt: startsAtIso, url: `https://app.ludoya.com/events/${createdId}` };
  }

  return { ok: true, match, httpStatus: res.status };
}



// -------- Group members (perfil público de un socio en Ludoya) --------

export interface LudoyaMember {
  id: string | null;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  role: string | null;
  stats: Record<string, number> | null;
  collection: Array<{ id?: string; name?: string; imageUrl?: string | null }>;
}

async function fetchGroupMembers(): Promise<any[]> {
  const res = await ludoyaFetch(`/members?pagination=200,0`);
  if (!res.ok) throw new Error(`Ludoya members error (${res.status})`);
  const json = (await res.json()) as any;
  return (
    json?.members?.elements ??
    json?.users?.elements ??
    json?.elements ??
    (Array.isArray(json) ? json : [])
  );
}

/** Perfil de un miembro del grupo KLEFF, cacheado 15 minutos en kv_cache. */
export async function getLudoyaMember(username: string): Promise<LudoyaMember | null> {
  const target = username.trim().toLowerCase();
  if (!target) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cacheKey = `ludoya:member:${target}`;
  const { data: cached } = await supabaseAdmin
    .from("kv_cache")
    .select("value, fetched_at")
    .eq("key", cacheKey)
    .maybeSingle();
  if (cached && Date.now() - Date.parse(cached.fetched_at) < 15 * 60 * 1000) {
    return cached.value as unknown as LudoyaMember;
  }

  let raw: any = null;
  try {
    const members = await fetchGroupMembers();
    raw = members.find((m) => String(m.username ?? m.user?.username ?? "").toLowerCase() === target) ?? null;
  } catch {
    /* fall through to public search */
  }
  if (!raw) {
    const found = await findLudoyaUserByUsername(target);
    if (!found) return null;
    raw = found;
  }

  const u = raw.user ?? raw;
  const member: LudoyaMember = {
    id: u.id ?? null,
    username: u.username ?? target,
    name: u.name ?? u.displayName ?? null,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
    joinedAt: raw.joinedAt ?? raw.createdAt ?? null,
    role: raw.role ?? null,
    stats:
      raw.stats && typeof raw.stats === "object"
        ? (raw.stats as Record<string, number>)
        : null,
    collection: Array.isArray(raw.collection?.elements)
      ? raw.collection.elements.slice(0, 12)
      : Array.isArray(raw.collection)
        ? raw.collection.slice(0, 12)
        : [],
  };

  await supabaseAdmin
    .from("kv_cache")
    .upsert({ key: cacheKey, value: member as unknown as any, fetched_at: new Date().toISOString() });

  return member;
}
