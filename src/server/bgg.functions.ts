import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BGG_USERNAME = "kleff_bcn";
const BGG_BASE = "https://boardgamegeek.com/xmlapi2";

// ---------- helpers (tiny XML parser, no deps) ----------

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

function parseXml(xml: string): XmlNode {
  // Strip XML declaration & comments
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
    .replace(/&#10;/g, "\n")
    .replace(/&#13;/g, "")
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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchBgg(url: string, maxAttempts = 10): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
    if (res.status === 429 || res.status === 503) {
      await sleep(5000 * attempt);
      continue;
    }
    if (!res.ok) throw new Error(`BGG ${url} -> ${res.status}`);
    return await res.text();
  }
  throw new Error(`BGG ${url} timed out`);
}

// ---------- main sync ----------

interface BggGameRecord {
  bgg_id: number;
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
  bgg_url: string;
  last_synced_at: string;
}

async function fetchCollectionIds(): Promise<number[]> {
  const xml = await fetchBgg(
    `${BGG_BASE}/collection?username=${BGG_USERNAME}&own=1&excludesubtype=boardgameexpansion`,
  );
  const root = parseXml(xml);
  const items = findAll(root, "item");
  const ids = items
    .map((i) => parseInt(i.attrs.objectid, 10))
    .filter((n) => Number.isFinite(n));
  return Array.from(new Set(ids));
}

function pickPrimaryName(thing: XmlNode): string {
  const names = findChildren(thing, "name");
  const primary = names.find((n) => n.attrs.type === "primary") ?? names[0];
  return primary?.attrs.value ?? "Untitled";
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

function pickFloatAttr(node: XmlNode | undefined, attr: string): number | null {
  if (!node) return null;
  const v = parseFloat(node.attrs[attr]);
  return Number.isFinite(v) ? v : null;
}

function parseThing(thing: XmlNode): BggGameRecord | null {
  const bggId = parseInt(thing.attrs.id, 10);
  if (!Number.isFinite(bggId)) return null;

  const stats = firstChild(thing, "statistics");
  const ratings = stats ? firstChild(stats, "ratings") : undefined;
  const average = ratings ? firstChild(ratings, "average") : undefined;
  const usersrated = ratings ? firstChild(ratings, "usersrated") : undefined;
  const averageweight = ratings ? firstChild(ratings, "averageweight") : undefined;
  const numweights = ratings ? firstChild(ratings, "numweights") : undefined;

  // Overall rank
  let rank: number | null = null;
  if (ratings) {
    const ranks = firstChild(ratings, "ranks");
    if (ranks) {
      const overall = findChildren(ranks, "rank").find(
        (r) => r.attrs.name === "boardgame" && r.attrs.type === "subtype",
      );
      if (overall && overall.attrs.value && overall.attrs.value !== "Not Ranked") {
        const v = parseInt(overall.attrs.value, 10);
        if (Number.isFinite(v)) rank = v;
      }
    }
  }

  const minP = pickIntAttr(firstChild(thing, "minplayers"), "value");
  const maxP = pickIntAttr(firstChild(thing, "maxplayers"), "value");
  const minT = pickIntAttr(firstChild(thing, "minplaytime"), "value");
  const maxT = pickIntAttr(firstChild(thing, "maxplaytime"), "value");
  const playt = pickIntAttr(firstChild(thing, "playingtime"), "value");
  const minAge = pickIntAttr(firstChild(thing, "minage"), "value");
  const yearPub = pickIntAttr(firstChild(thing, "yearpublished"), "value");

  const image = firstChild(thing, "image")?.text ?? null;
  const thumb = firstChild(thing, "thumbnail")?.text ?? null;
  const description = firstChild(thing, "description")?.text ?? null;

  const categories = pickLinks(thing, "boardgamecategory");
  const mechanics = pickLinks(thing, "boardgamemechanic");
  const families = pickLinks(thing, "boardgamefamily");
  const designers = pickLinks(thing, "boardgamedesigner");
  const publishers = pickLinks(thing, "boardgamepublisher");

  // Heuristic for "type" based on families/categories
  const familyText = families.join(" ").toLowerCase();
  let bggType: string | null = null;
  if (familyText.includes("party game")) bggType = "Party";
  else if (categories.some((c) => /children/i.test(c))) bggType = "Children";
  else if (familyText.includes("strategy")) bggType = "Strategy";
  else if (familyText.includes("thematic")) bggType = "Thematic";
  else if (familyText.includes("wargame")) bggType = "Wargame";
  else if (familyText.includes("customizable")) bggType = "Customizable";
  else if (familyText.includes("abstract")) bggType = "Abstract";
  else bggType = "Family";

  return {
    bgg_id: bggId,
    title: pickPrimaryName(thing),
    image_url: image,
    thumbnail_url: thumb,
    description: description ? decodeEntities(description).slice(0, 4000) : null,
    year_published: yearPub,
    min_players: minP,
    max_players: maxP,
    min_playtime: minT,
    max_playtime: maxT,
    duration_minutes: playt ?? maxT,
    min_age: minAge,
    bgg_rating: pickFloatAttr(average, "value"),
    bgg_rating_users: pickIntAttr(usersrated, "value"),
    bgg_weight: pickFloatAttr(averageweight, "value"),
    bgg_weight_users: pickIntAttr(numweights, "value"),
    bgg_rank: rank,
    bgg_type: bggType,
    categories,
    mechanics,
    families,
    designers,
    publishers,
    bgg_url: `https://boardgamegeek.com/boardgame/${bggId}`,
    last_synced_at: new Date().toISOString(),
  };
}

async function fetchThings(ids: number[]): Promise<BggGameRecord[]> {
  // Chunk IDs (BGG accepts comma-separated; keep chunks small for stability)
  const chunkSize = 20;
  const out: BggGameRecord[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const xml = await fetchBgg(
      `${BGG_BASE}/thing?id=${chunk.join(",")}&stats=1`,
    );
    const root = parseXml(xml);
    for (const thing of findAll(root, "item")) {
      const rec = parseThing(thing);
      if (rec) out.push(rec);
    }
    // Be polite to BGG
    await sleep(800);
  }
  return out;
}

export async function syncBggCollection(): Promise<{
  fetched: number;
  upserted: number;
  removedInactive: number;
}> {
  const ids = await fetchCollectionIds();
  if (ids.length === 0) {
    return { fetched: 0, upserted: 0, removedInactive: 0 };
  }
  const records = await fetchThings(ids);

  // Upsert by bgg_id. Keep `id`, `total_copies`, `max_rental_days`, `is_active` if existing.
  const { data: existing, error: exErr } = await supabaseAdmin
    .from("bgg_games")
    .select("id, bgg_id")
    .not("bgg_id", "is", null);
  if (exErr) throw new Error(exErr.message);
  const byBggId = new Map<number, string>();
  for (const e of existing ?? []) {
    if (e.bgg_id) byBggId.set(e.bgg_id, e.id);
  }

  // Build inserts and updates
  const toInsert: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ id: string; patch: Record<string, unknown> }> = [];
  for (const r of records) {
    const existingId = byBggId.get(r.bgg_id);
    const payload: Record<string, unknown> = { ...r };
    if (existingId) {
      toUpdate.push({ id: existingId, patch: payload });
    } else {
      toInsert.push({
        ...payload,
        is_active: true,
        total_copies: 1,
        max_rental_days: 14,
      });
    }
  }

  if (toInsert.length) {
    const { error } = await supabaseAdmin
      .from("bgg_games")
      .insert(toInsert as never);
    if (error) throw new Error(`insert: ${error.message}`);
  }
  for (const u of toUpdate) {
    const { error } = await supabaseAdmin
      .from("bgg_games")
      .update(u.patch as never)
      .eq("id", u.id);
    if (error) throw new Error(`update ${u.id}: ${error.message}`);
  }

  // Mark games no longer in the BGG collection as inactive
  const currentBggIds = new Set(records.map((r) => r.bgg_id));
  let removedInactive = 0;
  for (const [bggId, id] of byBggId) {
    if (!currentBggIds.has(bggId)) {
      const { error } = await supabaseAdmin
        .from("bgg_games")
        .update({ is_active: false } as never)
        .eq("id", id);
      if (!error) removedInactive++;
    }
  }

  return {
    fetched: records.length,
    upserted: toInsert.length + toUpdate.length,
    removedInactive,
  };
}

// ---------- exposed server fns ----------

async function assertSuperAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminSyncBggCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.userId);
    const result = await syncBggCollection();
    return result;
  });

export const listLudoteca = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("bgg_games")
    .select(
      "id, bgg_id, title, image_url, thumbnail_url, year_published, min_players, max_players, min_playtime, max_playtime, duration_minutes, min_age, bgg_rating, bgg_rating_users, bgg_weight, bgg_weight_users, bgg_rank, bgg_type, categories, mechanics, bgg_url, is_active, last_synced_at",
    )
    .eq("is_active", true)
    .order("bgg_rating", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return { games: data ?? [], syncedAt: data?.[0]?.last_synced_at ?? null };
});
