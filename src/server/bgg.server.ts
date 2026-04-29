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

// ---------- BGG XML enrichment (best effort) ----------

async function fetchBgg(url: string, maxAttempts = 4): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/xml,text/xml,*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });
      if (res.status === 202) {
        await sleep(2000 * attempt);
        continue;
      }
      if (res.status === 401 || res.status === 403) return null; // blocked
      if (res.status === 429 || res.status === 503) {
        await sleep(3000 * attempt);
        continue;
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await sleep(1000 * attempt);
    }
  }
  return null;
}

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

function pickLinks(thing: XmlNode, type: string): string[] {
  return findChildren(thing, "link")
    .filter((l) => l.attrs.type === type)
    .map((l) => l.attrs.value)
    .filter(Boolean);
}
function pickIntAttr(node: XmlNode | undefined, attr: string): number | null {
  if (!node) return null;
  const v = parseInt(node.attrs[attr], 10);
  return Number.isFinite(v) ? v : null;
}
function pickFloatAttr(
  node: XmlNode | undefined,
  attr: string,
): number | null {
  if (!node) return null;
  const v = parseFloat(node.attrs[attr]);
  return Number.isFinite(v) ? v : null;
}

function inferType(
  families: string[],
  categories: string[],
): string | null {
  const familyText = families.join(" ").toLowerCase();
  if (familyText.includes("party game")) return "Party";
  if (categories.some((c) => /children/i.test(c))) return "Children";
  if (familyText.includes("strategy")) return "Strategy";
  if (familyText.includes("thematic")) return "Thematic";
  if (familyText.includes("wargame")) return "Wargame";
  if (familyText.includes("customizable")) return "Customizable";
  if (familyText.includes("abstract")) return "Abstract";
  return "Family";
}

function parseThingExtras(thing: XmlNode): BggThingExtras {
  const stats = firstChild(thing, "statistics");
  const ratings = stats ? firstChild(stats, "ratings") : undefined;
  const average = ratings ? firstChild(ratings, "average") : undefined;
  const usersrated = ratings ? firstChild(ratings, "usersrated") : undefined;
  const averageweight = ratings
    ? firstChild(ratings, "averageweight")
    : undefined;
  const numweights = ratings ? firstChild(ratings, "numweights") : undefined;

  let rank: number | null = null;
  if (ratings) {
    const ranks = firstChild(ratings, "ranks");
    if (ranks) {
      const overall = findChildren(ranks, "rank").find(
        (r) => r.attrs.name === "boardgame" && r.attrs.type === "subtype",
      );
      if (
        overall &&
        overall.attrs.value &&
        overall.attrs.value !== "Not Ranked"
      ) {
        const v = parseInt(overall.attrs.value, 10);
        if (Number.isFinite(v)) rank = v;
      }
    }
  }

  const categories = pickLinks(thing, "boardgamecategory");
  const mechanics = pickLinks(thing, "boardgamemechanic");
  const families = pickLinks(thing, "boardgamefamily");
  const designers = pickLinks(thing, "boardgamedesigner");
  const publishers = pickLinks(thing, "boardgamepublisher");

  const description = firstChild(thing, "description")?.text ?? null;
  const image = firstChild(thing, "image")?.text ?? null;
  const thumb = firstChild(thing, "thumbnail")?.text ?? null;

  return {
    categories,
    mechanics,
    families,
    designers,
    publishers,
    description: description ? decodeEntities(description).slice(0, 4000) : null,
    bgg_rank: rank,
    bgg_rating: pickFloatAttr(average, "value"),
    bgg_rating_users: pickIntAttr(usersrated, "value"),
    bgg_weight: pickFloatAttr(averageweight, "value"),
    bgg_weight_users: pickIntAttr(numweights, "value"),
    bgg_type: inferType(families, categories),
    image_url: image,
    thumbnail_url: thumb,
  };
}

async function enrichWithBgg(
  ids: number[],
): Promise<Map<number, BggThingExtras>> {
  const out = new Map<number, BggThingExtras>();
  if (ids.length === 0) return out;

  // Probe once. If BGG blocks us, skip enrichment entirely.
  const probe = await fetchBgg(`${BGG_BASE}/thing?id=${ids[0]}&stats=1`);
  if (!probe) return out;

  const chunkSize = 20;
  // Process the probe's chunk normally (re-issue first chunk for consistency)
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const xml = await fetchBgg(
      `${BGG_BASE}/thing?id=${chunk.join(",")}&stats=1`,
    );
    if (!xml) continue;
    const root = parseXml(xml);
    for (const thing of findAll(root, "item")) {
      const id = parseInt(thing.attrs.id, 10);
      if (!Number.isFinite(id)) continue;
      out.set(id, parseThingExtras(thing));
    }
    await sleep(800);
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
