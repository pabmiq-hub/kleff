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

// ---------- tiny XML parser (no deps) ----------

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

function parseXml(xml: string): XmlNode {
  const cleaned = xml
    .replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const root: XmlNode = { tag: "#root", attrs: {}, children: [], text: "" };
  const stack: XmlNode[] = [root];
  const re = /<\/?([\w:.-]+)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) {
    const [full, tag, attrsStr, selfClose, text] = m;
    if (text !== undefined) {
      const t = text.trim();
      if (t) stack[stack.length - 1].text += t;
      continue;
    }
    if (full.startsWith("</")) {
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    const attrRe = /([\w:.-]+)="([^"]*)"/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrsStr))) {
      attrs[am[1]] = decodeEntities(am[2]);
    }
    const node: XmlNode = { tag, attrs, children: [], text: "" };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  return root;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function findAll(node: XmlNode, tag: string): XmlNode[] {
  const out: XmlNode[] = [];
  for (const c of node.children) {
    if (c.tag === tag) out.push(c);
    out.push(...findAll(c, tag));
  }
  return out;
}

function findChildren(node: XmlNode, tag: string): XmlNode[] {
  return node.children.filter((c) => c.tag === tag);
}

function firstChild(node: XmlNode, tag: string): XmlNode | undefined {
  return node.children.find((c) => c.tag === tag);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  return (data.games ?? []).filter((g) => !g.isExpansion);
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
  };
}

async function fetchGeekdoItem(id: number): Promise<GeekdoItem | null> {
  const url = `${GEEKDO_BASE}?objectid=${id}&objecttype=thing&showcount=10`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; KleffSync/1.0; +https://kleff.lovable.app)",
        },
      });
      if (res.status === 429 || res.status === 503) {
        await sleep(1500 * attempt);
        continue;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as { item?: GeekdoItem };
      return data.item ?? null;
    } catch {
      await sleep(800 * attempt);
    }
  }
  return null;
}

async function enrichWithBgg(
  ids: number[],
): Promise<Map<number, BggThingExtras>> {
  const out = new Map<number, BggThingExtras>();
  if (ids.length === 0) return out;

  // Probe once. If geekdo is unreachable from this runtime, skip enrichment.
  const probe = await fetchGeekdoItem(ids[0]);
  if (!probe) return out;
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

function buildRecord(
  g: LudoyaGame,
  bggId: number | null,
  extra: BggThingExtras | undefined,
): BggGameRecord {
  const minP = g.minPlayerCount ?? null;
  const maxP = g.maxPlayerCount ?? null;
  const minT = g.minPlayTimeMinutes ?? null;
  const maxT = g.maxPlayTimeMinutes ?? null;
  const rating = g.bggRating && g.bggRating > 0 ? g.bggRating : null;
  return {
    bgg_id: bggId,
    title: g.name,
    image_url: extra?.image_url ?? g.image?.url ?? null,
    thumbnail_url:
      extra?.thumbnail_url ?? g.image?.thumbnailUrl ?? g.image?.previewUrl ?? null,
    description: extra?.description ?? null,
    year_published: g.yearPublished ?? null,
    min_players: minP,
    max_players: maxP,
    min_playtime: minT,
    max_playtime: maxT,
    duration_minutes: maxT ?? minT ?? null,
    min_age: g.minAge ?? null,
    bgg_rating: extra?.bgg_rating ?? rating,
    bgg_rating_users: extra?.bgg_rating_users ?? null,
    bgg_weight: extra?.bgg_weight ?? g.complexity ?? null,
    bgg_weight_users: extra?.bgg_weight_users ?? null,
    bgg_rank: extra?.bgg_rank ?? null,
    bgg_type: extra?.bgg_type ?? null,
    categories: extra?.categories ?? [],
    mechanics: extra?.mechanics ?? [],
    families: extra?.families ?? [],
    designers: extra?.designers ?? [],
    publishers: extra?.publishers ?? [],
    bgg_url: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
    last_synced_at: new Date().toISOString(),
  };
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

  // Reuse existing bgg_id mapping so we don't refetch slugs every time.
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("bgg_games")
    .select("id, bgg_id, title");
  if (exErr) throw new Error(exErr.message);

  const existingByTitle = new Map<string, { id: string; bgg_id: number | null }>();
  for (const e of existing ?? []) {
    existingByTitle.set(e.title.toLowerCase(), {
      id: e.id,
      bgg_id: e.bgg_id ?? null,
    });
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
  // Resolve in small parallel batches (Ludoya is fast).
  const BATCH = 8;
  for (let i = 0; i < slugsToResolve.length; i += BATCH) {
    const batch = slugsToResolve.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((g) => fetchLudoyaBggId(g.slug)),
    );
    batch.forEach((g, idx) => bggIdByGame.set(g.id, results[idx]));
  }

  // Try to enrich from BGG (mechanics/categories/type). Best effort.
  const allBggIds = Array.from(bggIdByGame.values()).filter(
    (x): x is number => x != null,
  );
  const extras = await enrichWithBgg(allBggIds);

  const records: Array<{ ludoyaName: string; rec: BggGameRecord }> = [];
  for (const g of ludoyaGames) {
    const bggId = bggIdByGame.get(g.id) ?? null;
    const extra = bggId ? extras.get(bggId) : undefined;
    records.push({ ludoyaName: g.name, rec: buildRecord(g, bggId, extra) });
  }

  // Upsert
  const toInsert: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ id: string; patch: Record<string, unknown> }> = [];
  for (const { ludoyaName, rec } of records) {
    const cached = existingByTitle.get(ludoyaName.toLowerCase());
    if (cached) {
      toUpdate.push({ id: cached.id, patch: { ...rec, is_active: true } });
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
    // Insert in chunks to avoid payload limits
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

  // Mark missing games inactive
  const seenTitles = new Set(records.map((r) => r.ludoyaName.toLowerCase()));
  let removedInactive = 0;
  for (const [title, info] of existingByTitle) {
    if (!seenTitles.has(title)) {
      const { error } = await supabaseAdmin
        .from("bgg_games")
        .update({ is_active: false } as never)
        .eq("id", info.id);
      if (!error) removedInactive++;
    }
  }

  return {
    fetched: records.length,
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
