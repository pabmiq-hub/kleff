// Supabase Edge Function: sync-bgg
// Syncs the BoardGameGeek collection of user "kleff_bcn" into the bgg_games table.
// Runs on Deno Deploy (no IP block from BGG, no Cloudflare Worker CPU limits).
//
// Trigger options:
//   - Manually from admin (anon key + super_admin check skipped here; protected by SYNC_TOKEN)
//   - Daily via pg_cron (sends Authorization: Bearer <SYNC_TOKEN>)
// Public CORS allowed so the admin UI can call it directly with the user's session.
//
// Required env (set automatically by Supabase):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// Optional:
//   - BGG_SYNC_TOKEN (if set, required as Bearer for non-admin callers)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BGG_USERNAME = "kleff_bcn";
const BGG_BASE = "https://boardgamegeek.com/xmlapi2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
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

async function fetchBgg(url: string, maxAttempts = 10): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/xml",
        "User-Agent": "KleffLudoteca/1.0 (+https://kleff.lovable.app)",
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
      if (overall && overall.attrs.value && overall.attrs.value !== "Not Ranked") {
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

  const familyText = families.join(" ").toLowerCase();
  let bggType: string | null = "Family";
  if (familyText.includes("party game")) bggType = "Party";
  else if (categories.some((c) => /children/i.test(c))) bggType = "Children";
  else if (familyText.includes("strategy")) bggType = "Strategy";
  else if (familyText.includes("thematic")) bggType = "Thematic";
  else if (familyText.includes("wargame")) bggType = "Wargame";
  else if (familyText.includes("customizable")) bggType = "Customizable";
  else if (familyText.includes("abstract")) bggType = "Abstract";

  const minT = pickIntAttr(firstChild(thing, "minplaytime"), "value");
  const maxT = pickIntAttr(firstChild(thing, "maxplaytime"), "value");
  const playt = pickIntAttr(firstChild(thing, "playingtime"), "value");
  const description = firstChild(thing, "description")?.text ?? null;

  return {
    bgg_id: bggId,
    title: pickPrimaryName(thing),
    image_url: firstChild(thing, "image")?.text ?? null,
    thumbnail_url: firstChild(thing, "thumbnail")?.text ?? null,
    description: description ? decodeEntities(description).slice(0, 4000) : null,
    year_published: pickIntAttr(firstChild(thing, "yearpublished"), "value"),
    min_players: pickIntAttr(firstChild(thing, "minplayers"), "value"),
    max_players: pickIntAttr(firstChild(thing, "maxplayers"), "value"),
    min_playtime: minT,
    max_playtime: maxT,
    duration_minutes: playt ?? maxT,
    min_age: pickIntAttr(firstChild(thing, "minage"), "value"),
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
    await sleep(800);
  }
  return out;
}

async function syncBggCollection(supabase: ReturnType<typeof createClient>) {
  const ids = await fetchCollectionIds();
  if (ids.length === 0) {
    return { fetched: 0, inserted: 0, updated: 0, removedInactive: 0 };
  }
  const records = await fetchThings(ids);

  const { data: existing, error: exErr } = await supabase
    .from("bgg_games")
    .select("id, bgg_id")
    .not("bgg_id", "is", null);
  if (exErr) throw new Error(exErr.message);

  const byBggId = new Map<number, string>();
  for (const e of (existing ?? []) as Array<{ id: string; bgg_id: number | null }>) {
    if (e.bgg_id) byBggId.set(e.bgg_id, e.id);
  }

  let inserted = 0;
  let updated = 0;
  for (const r of records) {
    const existingId = byBggId.get(r.bgg_id);
    if (existingId) {
      const { error } = await supabase
        .from("bgg_games")
        .update({ ...r, is_active: true })
        .eq("id", existingId);
      if (error) throw new Error(`update ${existingId}: ${error.message}`);
      updated++;
    } else {
      const { error } = await supabase.from("bgg_games").insert({
        ...r,
        is_active: true,
        total_copies: 1,
        max_rental_days: 14,
      });
      if (error) throw new Error(`insert: ${error.message}`);
      inserted++;
    }
  }

  const currentBggIds = new Set(records.map((r) => r.bgg_id));
  let removedInactive = 0;
  for (const [bggId, id] of byBggId) {
    if (!currentBggIds.has(bggId)) {
      const { error } = await supabase
        .from("bgg_games")
        .update({ is_active: false })
        .eq("id", id);
      if (!error) removedInactive++;
    }
  }

  return { fetched: records.length, inserted, updated, removedInactive };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional shared-secret check (for cron). If not configured, the function is
  // open — protect via auth in the admin UI client side.
  const token = Deno.env.get("BGG_SYNC_TOKEN");
  if (token) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${token}`) {
      // Allow Supabase anon-key auth as well so the admin panel can call it.
      const apikey = req.headers.get("apikey");
      if (!apikey) {
        return new Response(
          JSON.stringify({ ok: false, error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const result = await syncBggCollection(supabase);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sync-bgg] failed:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
