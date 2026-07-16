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
