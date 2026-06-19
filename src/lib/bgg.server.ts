// Server-only catalog sync. Imports the admin Supabase client, so this
// file MUST NOT be imported from any client-reachable module.
//
// Source of truth: https://api.ludoya.com/users/kleff/boardgames
// (BGG's public XML API blocks our outbound IPs, so we rely on the Ludoya
// mirror that already aggregates the kleff_bcn collection.)
//
// Enrichment: BGG's internal JSON API at api.geekdo.com/api/geekitems —
// it is publicly reachable and returns mechanics, categories and the
// "subdomain" (which BGG uses for the family/strategy/party… classification).

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LUDOYA_URL = "https://api.ludoya.com/users/kleff/boardgames";
const GEEKDO_BASE = "https://api.geekdo.com/api/geekitems";
const BGG_COLLECTION_USER = "kleff_bcn";
const BGG_COLLECTION_URL = `https://boardgamegeek.com/collection/user/${BGG_COLLECTION_USER}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- BGG collection display names (via Firecrawl) ----------
//
// BGG's XML API returns 401 for this user's collection from our egress IPs,
// and Ludoya stores only BGG's primary game name (e.g. "Sounds Fishy")
// instead of the edition title the owner sees on
// boardgamegeek.com/collection/user/kleff_bcn (e.g. "Chao Pescao!").
// We scrape the public HTML collection page through Firecrawl to recover
// the user-collection display name per bgg_id.

async function fetchBggDisplayNames(): Promise<Map<number, string>> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const map = new Map<number, string>();
  if (!apiKey) {
    console.warn("[bgg-names] FIRECRAWL_API_KEY missing → skip");
    return map;
  }
  for (let page = 1; page <= 10; page++) {
    const url = `${BGG_COLLECTION_URL}?pageID=${page}`;
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });
      if (!res.ok) {
        console.warn(`[bgg-names] page ${page} → ${res.status}`);
        break;
      }
      const json = (await res.json()) as { data?: { markdown?: string } };
      const md = json.data?.markdown ?? "";
      const re =
        /\[([^\]]+)\]\(https:\/\/boardgamegeek\.com\/boardgame(?:expansion)?\/(\d+)/g;
      let count = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(md))) {
        const name = m[1].trim();
        const id = parseInt(m[2], 10);
        if (!Number.isFinite(id) || !name) continue;
        if (!map.has(id)) map.set(id, name);
        count++;
      }
      console.log(`[bgg-names] page ${page}: ${count} matches`);
      if (count < 300) break;
      await sleep(400);
    } catch (e) {
      console.warn(
        `[bgg-names] page ${page} failed:`,
        e instanceof Error ? e.message : String(e),
      );
      break;
    }
  }
  console.log(`[bgg-names] total ${map.size} display names`);
  return map;
}

// ---------- record shape ----------

interface BggGameRecord {
  bgg_id: number | null;
  title: string;
  image_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  year_published: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  duration_minutes: number | null;
  min_age: number | null;
  bgg_rating: number | null;
  bgg_rating_users: number | null;
  bgg_weight: number | null;
  bgg_weight_users: number | null;
  bgg_rank: number | null;
  bgg_type: string | null;
  categories: string[];
  mechanics: string[];
  families: string[];
  designers: string[];
  publishers: string[];
  bgg_url: string | null;
  last_synced_at: string;
}

// ---------- Ludoya fetch ----------

interface LudoyaImage {
  url?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
}
interface LudoyaGame {
  id: string;
  slug: string;
  name: string;
  isExpansion?: boolean;
  yearPublished?: number | null;
  minPlayerCount?: number | null;
  maxPlayerCount?: number | null;
  minPlayTimeMinutes?: number | null;
  maxPlayTimeMinutes?: number | null;
  minAge?: number | null;
  complexity?: number | null;
  bggRating?: number | null;
  image?: LudoyaImage | null;
}

async function fetchLudoyaCollection(): Promise<LudoyaGame[]> {
  const res = await fetch(LUDOYA_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (compatible; KleffSync/1.0; +https://kleff.lovable.app)",
    },
  });
  if (!res.ok) {
    throw new Error(`Ludoya ${LUDOYA_URL} -> ${res.status}`);
  }
  const data = (await res.json()) as { games?: LudoyaGame[] };
  // Include expansions too — the catalogue should list everything the
  // collection on BGG contains.
  return data.games ?? [];
}

async function fetchLudoyaBggId(slug: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.ludoya.com/boardgames/${slug}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { bggUrl?: string | null };
    const url = data.bggUrl ?? "";
    const m = url.match(/\/boardgame\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  } catch {
    return null;
  }
}

// ---------- BGG enrichment via geekdo JSON API ----------

interface BggThingExtras {
  categories: string[];
  mechanics: string[];
  families: string[];
  designers: string[];
  publishers: string[];
  description: string | null;
  bgg_rank: number | null;
  bgg_rating: number | null;
  bgg_rating_users: number | null;
  bgg_weight: number | null;
  bgg_weight_users: number | null;
  bgg_type: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  bgg_primary_name: string | null;
}


interface GeekdoLink {
  name?: string;
}
interface GeekdoItem {
  name?: string;
  imageurl?: string | null;
  short_description?: string | null;
  description?: string | null;
  links?: Record<string, GeekdoLink[]>;
  stats?: {
    average?: number | string | null;
    usersrated?: number | string | null;
    averageweight?: number | string | null;
    numweights?: number | string | null;
    rank?: Array<{ name?: string; type?: string; rank?: string | number | null }>;
  };
}

function pickNames(item: GeekdoItem, key: string): string[] {
  const arr = item.links?.[key];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((l) => (l && typeof l.name === "string" ? l.name : ""))
    .filter(Boolean);
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}
function intNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function mapSubdomainToType(subdomains: string[]): string | null {
  // BGG's subdomain values: "Family Games", "Strategy Games", "Thematic Games",
  // "Party Games", "Wargames", "Customizable Games", "Abstract Games",
  // "Children's Games". We strip the trailing "Games" and singularize.
  if (subdomains.length === 0) return null;
  const map: Record<string, string> = {
    "Family Games": "Familiar",
    "Strategy Games": "Estrategia",
    "Thematic Games": "Temático",
    "Party Games": "Party",
    "Wargames": "Wargame",
    "Customizable Games": "Coleccionable",
    "Abstract Games": "Abstracto",
    "Children's Games": "Infantil",
  };
  return map[subdomains[0]] ?? subdomains[0].replace(/\s*Games?$/i, "").trim();
}

function inferTypeFallback(families: string[], categories: string[]): string {
  const familyText = families.join(" ").toLowerCase();
  if (familyText.includes("party game")) return "Party";
  if (categories.some((c) => /children/i.test(c))) return "Infantil";
  if (familyText.includes("strategy")) return "Estrategia";
  if (familyText.includes("thematic")) return "Temático";
  if (familyText.includes("wargame")) return "Wargame";
  if (familyText.includes("abstract")) return "Abstracto";
  return "Familiar";
}

function parseGeekdoItem(item: GeekdoItem): BggThingExtras {
  const categories = pickNames(item, "boardgamecategory");
  const mechanics = pickNames(item, "boardgamemechanic");
  const families = pickNames(item, "boardgamefamily");
  const designers = pickNames(item, "boardgamedesigner");
  const publishers = pickNames(item, "boardgamepublisher");
  const subdomains = pickNames(item, "boardgamesubdomain");

  let bgg_rank: number | null = null;
  const ranks = item.stats?.rank;
  if (Array.isArray(ranks)) {
    const overall = ranks.find(
      (r) => r?.name === "boardgame" && r?.type === "subtype",
    );
    if (overall && overall.rank && overall.rank !== "Not Ranked") {
      bgg_rank = intNum(overall.rank);
    }
  }

  const desc = item.short_description ?? item.description ?? null;

  return {
    categories,
    mechanics,
    families,
    designers,
    publishers,
    description: desc ? String(desc).slice(0, 4000) : null,
    bgg_rank,
    bgg_rating: num(item.stats?.average),
    bgg_rating_users: intNum(item.stats?.usersrated),
    bgg_weight: num(item.stats?.averageweight),
    bgg_weight_users: intNum(item.stats?.numweights),
    bgg_type:
      mapSubdomainToType(subdomains) ?? inferTypeFallback(families, categories),
    image_url: item.imageurl ?? null,
    thumbnail_url: null,
    bgg_primary_name: item.name ? String(item.name).trim() : null,
  };
}


async function fetchGeekdoItem(id: number): Promise<GeekdoItem | null> {
  const url = `${GEEKDO_BASE}?objectid=${id}&objecttype=thing&showcount=10`;
  // Direct fetch only. If BGG blocks our egress IP we just skip enrichment;
  // existing values in `bgg_games` are preserved by buildRecord/merge logic.
  let directStatus: number | string = "no-resp";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://boardgamegeek.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
      directStatus = res.status;
      if (res.status === 429 || res.status === 503) {
        await sleep(1500 * attempt);
        continue;
      }
      if (res.ok) {
        const data = (await res.json()) as { item?: GeekdoItem };
        if (data.item) return data.item;
      }
      break;
    } catch (e) {
      directStatus = `err:${e instanceof Error ? e.message : String(e)}`;
      await sleep(800 * attempt);
    }
  }
  console.log(`[bgg-enrich] direct=${directStatus} → skip (no Firecrawl fallback)`);
  return null;
}


async function enrichWithBgg(
  ids: number[],
): Promise<Map<number, BggThingExtras>> {
  const out = new Map<number, BggThingExtras>();
  if (ids.length === 0) return out;

  // Probe once. If geekdo is unreachable from this runtime, skip enrichment.
  const probe = await fetchGeekdoItem(ids[0]);
  if (!probe) {
    console.warn(`[bgg-enrich] probe failed for id=${ids[0]} → skipping enrichment`);
    return out;
  }
  out.set(ids[0], parseGeekdoItem(probe));

  // Process in small parallel batches to be polite.
  const CONCURRENCY = 4;
  const remaining = ids.slice(1);
  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((id) => fetchGeekdoItem(id)));
    batch.forEach((id, idx) => {
      const item = results[idx];
      if (item) out.set(id, parseGeekdoItem(item));
    });
    await sleep(200);
  }
  return out;
}

// ---------- merge & persist ----------

type ExistingRow = {
  id: string;
  bgg_id: number | null;
  title: string;
  bgg_type: string | null;
  categories: string[] | null;
  mechanics: string[] | null;
  families: string[] | null;
  designers: string[] | null;
  publishers: string[] | null;
  description: string | null;
  bgg_rating: number | null;
  bgg_rating_users: number | null;
  bgg_weight: number | null;
  bgg_weight_users: number | null;
  bgg_rank: number | null;
  image_url: string | null;
  thumbnail_url: string | null;
  last_synced_at: string | null;
};


function buildRecord(
  g: LudoyaGame,
  bggId: number | null,
  extra: BggThingExtras | undefined,
  prev: ExistingRow | undefined,
  bggPrimaryName: string | null,
  bggDisplayName: string | null,
): BggGameRecord {
  const minP = g.minPlayerCount ?? null;
  const maxP = g.maxPlayerCount ?? null;
  const minT = g.minPlayTimeMinutes ?? null;
  const maxT = g.maxPlayTimeMinutes ?? null;
  const rating = g.bggRating && g.bggRating > 0 ? g.bggRating : null;
  // Prefer the title the owner sees on their BGG collection page (edition
  // name, e.g. "Chao Pescao!"). Fall back to Ludoya's name, then BGG's
  // primary name, then whatever was stored previously.
  const title =
    bggDisplayName ||
    g.name?.trim() ||
    bggPrimaryName ||
    prev?.title ||
    "Untitled";
  // Preserve previously-enriched values when this run did not enrich.
  return {
    bgg_id: bggId,
    title,
    image_url: extra?.image_url ?? prev?.image_url ?? g.image?.url ?? null,
    thumbnail_url:
      extra?.thumbnail_url ?? prev?.thumbnail_url ?? g.image?.thumbnailUrl ?? g.image?.previewUrl ?? null,
    description: extra?.description ?? prev?.description ?? null,
    year_published: g.yearPublished ?? null,
    min_players: minP,
    max_players: maxP,
    min_playtime: minT,
    max_playtime: maxT,
    duration_minutes: maxT ?? minT ?? null,
    min_age: g.minAge ?? null,
    bgg_rating: extra?.bgg_rating ?? prev?.bgg_rating ?? rating,
    bgg_rating_users: extra?.bgg_rating_users ?? prev?.bgg_rating_users ?? null,
    bgg_weight: extra?.bgg_weight ?? prev?.bgg_weight ?? g.complexity ?? null,
    bgg_weight_users: extra?.bgg_weight_users ?? prev?.bgg_weight_users ?? null,
    bgg_rank: extra?.bgg_rank ?? prev?.bgg_rank ?? null,
    bgg_type: extra?.bgg_type ?? prev?.bgg_type ?? null,
    categories: extra?.categories ?? prev?.categories ?? [],
    mechanics: extra?.mechanics ?? prev?.mechanics ?? [],
    families: extra?.families ?? prev?.families ?? [],
    designers: extra?.designers ?? prev?.designers ?? [],
    publishers: extra?.publishers ?? prev?.publishers ?? [],
    bgg_url: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
    last_synced_at: new Date().toISOString(),
  };
}


const ENRICH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function alreadyEnriched(row: ExistingRow | undefined): boolean {
  if (!row) return false;
  if (!row.bgg_type) return false;
  if (!row.mechanics || row.mechanics.length === 0) return false;
  if (!row.last_synced_at) return false;
  const age = Date.now() - new Date(row.last_synced_at).getTime();
  return age < ENRICH_TTL_MS;
}

export async function syncBggCollection(): Promise<{
  fetched: number;
  upserted: number;
  removedInactive: number;
  enriched: number;
}> {
  const ludoyaGames = await fetchLudoyaCollection();
  if (ludoyaGames.length === 0) {
    return { fetched: 0, upserted: 0, removedInactive: 0, enriched: 0 };
  }

  // Reuse existing bgg_id mapping + enrichment so we don't refetch from BGG
  // for games that are already complete and fresh.
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("bgg_games")
    .select(
      "id, bgg_id, title, bgg_type, categories, mechanics, families, designers, publishers, description, bgg_rating, bgg_rating_users, bgg_weight, bgg_weight_users, bgg_rank, image_url, thumbnail_url, last_synced_at",
    );
  if (exErr) throw new Error(exErr.message);

  const existingRows: ExistingRow[] = (existing ?? []) as ExistingRow[];
  const existingByTitle = new Map<string, ExistingRow>();
  const existingByBggId = new Map<number, ExistingRow>();
  for (const e of existingRows) {
    existingByTitle.set(e.title.toLowerCase(), e);
    if (e.bgg_id != null) existingByBggId.set(e.bgg_id, e);
  }

  // Resolve bgg_id per game (use cached value when possible).
  const bggIdByGame = new Map<string, number | null>();
  const slugsToResolve: LudoyaGame[] = [];
  for (const g of ludoyaGames) {
    const cached = existingByTitle.get(g.name.toLowerCase());
    if (cached?.bgg_id) {
      bggIdByGame.set(g.id, cached.bgg_id);
    } else {
      slugsToResolve.push(g);
    }
  }
  const BATCH = 8;
  for (let i = 0; i < slugsToResolve.length; i += BATCH) {
    const batch = slugsToResolve.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((g) => fetchLudoyaBggId(g.slug)));
    batch.forEach((g, idx) => bggIdByGame.set(g.id, results[idx]));
  }

  // Decide which BGG ids actually need enrichment this run.
  const idsToEnrich: number[] = [];
  for (const g of ludoyaGames) {
    const bggId = bggIdByGame.get(g.id) ?? null;
    if (bggId == null) continue;
    const prev =
      existingByBggId.get(bggId) ?? existingByTitle.get(g.name.toLowerCase());
    if (alreadyEnriched(prev)) continue;
    idsToEnrich.push(bggId);
  }
  const extras = await enrichWithBgg(idsToEnrich);

  // Build records, matching existing rows by bgg_id first (handles renamed
  // titles) and only falling back to lowercase title.
  const matchedIds = new Set<string>();
  const toInsert: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ id: string; patch: Record<string, unknown> }> = [];

  for (const g of ludoyaGames) {
    const bggId = bggIdByGame.get(g.id) ?? null;
    const extra = bggId ? extras.get(bggId) : undefined;
    const prev =
      (bggId != null ? existingByBggId.get(bggId) : undefined) ??
      existingByTitle.get(g.name.toLowerCase());
    const bggPrimaryName = extra?.bgg_primary_name ?? null;
    const rec = buildRecord(g, bggId, extra, prev, bggPrimaryName);
    if (prev) {
      matchedIds.add(prev.id);
      toUpdate.push({ id: prev.id, patch: { ...rec, is_active: true } });
    } else {
      toInsert.push({
        ...rec,
        is_active: true,
        total_copies: 1,
        max_rental_days: 14,
      });
    }
  }

  if (toInsert.length) {
    const CHUNK = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from("bgg_games")
        .insert(slice as never);
      if (error) throw new Error(`insert: ${error.message}`);
    }
  }
  for (const u of toUpdate) {
    const { error } = await supabaseAdmin
      .from("bgg_games")
      .update(u.patch as never)
      .eq("id", u.id);
    if (error) throw new Error(`update ${u.id}: ${error.message}`);
  }

  // Mark missing games inactive (anything not matched this run).
  let removedInactive = 0;
  for (const row of existingRows) {
    if (matchedIds.has(row.id)) continue;
    const { error } = await supabaseAdmin
      .from("bgg_games")
      .update({ is_active: false } as never)
      .eq("id", row.id);
    if (!error) removedInactive++;
  }

  return {
    fetched: ludoyaGames.length,
    upserted: toInsert.length + toUpdate.length,
    removedInactive,
    enriched: extras.size,
  };
}



export async function assertSuperAdminBgg(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}
