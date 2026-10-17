// Game content translation for Juegos. The JSON is authored in Spanish; other
// languages are generated once with Gemini and cached in mm_translations,
// keyed "table:id:field[.path]" so every read can overlay them cheaply.
import { aiText } from "@/lib/ai.server";
import { db } from "./engine.server";
import { MM_LANGS, type MMLang } from "./i18n";

export const TR_FIELDS: Record<string, string[]> = {
  mm_games: ["title", "synopsis", "briefing", "murder_event", "final_reveal", "readings"],
  mm_acts: ["name", "narrative_text"],
  mm_characters: ["description", "alibi", "public_summary", "costume", "relationships"],
  mm_secrets: ["content"],
  mm_objectives: ["text"],
  mm_items: ["name", "description"],
  mm_abilities: ["name", "description"],
  mm_evidences: ["title", "content"],
  mm_joint_actions: ["name", "description"],
};

const SKIP_KEYS = new Set(["ref", "character", "reader", "act", "trigger", "type", "key", "font_display"]);
const isText = (v: unknown): v is string => typeof v === "string" && /\p{L}/u.test(v) && v.trim().length > 1;

function walk(prefix: string, value: unknown, visit: (key: string, v: string) => string | void): unknown {
  if (isText(value)) {
    const r = visit(prefix, value);
    return typeof r === "string" ? r : value;
  }
  if (Array.isArray(value)) return value.map((v, i) => walk(`${prefix}.${i}`, v, visit));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP_KEYS.has(k) || k.endsWith("_url") ? v : walk(`${prefix}.${k}`, v, visit);
    return out;
  }
  return value;
}

export type Tr = {
  lang: MMLang;
  row: <T extends Record<string, any>>(table: string, row: T | null | undefined) => T;
  rows: <T extends Record<string, any>>(table: string, rows: T[] | null | undefined) => T[];
};

export async function loadTr(gameId: string, lang: string | null | undefined): Promise<Tr> {
  const l = (MM_LANGS.some((x) => x.code === lang) ? lang : "es") as MMLang;
  let map: Record<string, string> = {};
  if (l !== "es") {
    const { data } = await db().from("mm_translations").select("data").eq("game_id", gameId).eq("lang", l).maybeSingle();
    map = (data?.data as Record<string, string>) ?? {};
  }
  const row = (table: string, r: any) => {
    if (!r || l === "es") return r;
    const out = { ...r };
    for (const f of TR_FIELDS[table] ?? []) if (f in out) out[f] = walk(`${table}:${r.id}:${f}`, out[f], (k) => map[k]);
    return out;
  };
  return { lang: l, row, rows: (table, rs) => (rs ?? []).map((r) => row(table, r)) };
}

async function collectStrings(gameId: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const { data: chars } = await db().from("mm_characters").select("*").eq("game_id", gameId);
  const charIds = (chars ?? []).map((c: any) => c.id);
  const byGame = (t: string) => db().from(t).select("*").eq("game_id", gameId);
  const byChar = (t: string) => (charIds.length ? db().from(t).select("*").in("character_id", charIds) : Promise.resolve({ data: [] }));
  const [{ data: game }, ...rest] = await Promise.all([
    db().from("mm_games").select("*").eq("id", gameId).single(),
    byGame("mm_acts"),
    byChar("mm_secrets"),
    byChar("mm_objectives"),
    byChar("mm_items"),
    byChar("mm_abilities"),
    byGame("mm_evidences"),
    byGame("mm_joint_actions"),
  ]);
  const tables: [string, any[]][] = [
    ["mm_games", [game]],
    ["mm_characters", chars ?? []],
    ["mm_acts", rest[0].data ?? []],
    ["mm_secrets", rest[1].data ?? []],
    ["mm_objectives", rest[2].data ?? []],
    ["mm_items", rest[3].data ?? []],
    ["mm_abilities", rest[4].data ?? []],
    ["mm_evidences", rest[5].data ?? []],
    ["mm_joint_actions", rest[6].data ?? []],
  ];
  for (const [t, rows] of tables)
    for (const r of rows) for (const f of TR_FIELDS[t]) if (r?.[f] != null) walk(`${t}:${r.id}:${f}`, r[f], (k, v) => void (out[k] = v));
  return out;
}

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** Translate (or refresh) a whole game into `lang`. Reuses the cache when the Spanish source hasn't changed. */
export async function translateGame(gameId: string, lang: MMLang, force = false): Promise<{ translated: number; cached: boolean }> {
  if (lang === "es") return { translated: 0, cached: true };
  const strings = await collectStrings(gameId);
  const h = await hash(JSON.stringify(strings));
  const { data: existing } = await db().from("mm_translations").select("source_hash, data").eq("game_id", gameId).eq("lang", lang).maybeSingle();
  if (!force && existing?.source_hash === h) return { translated: Object.keys(existing.data ?? {}).length, cached: true };
  const prev = (existing?.data ?? {}) as Record<string, string>;
  const langName = MM_LANGS.find((l) => l.code === lang)!.name;
  const entries = Object.entries(strings);
  const chunks: [string, string][][] = [];
  for (let i = 0; i < entries.length; i += 40) chunks.push(entries.slice(i, i + 40));
  const result: Record<string, string> = {};
  const system =
    `You translate the content of a Spanish murder-mystery party game into ${langName}. ` +
    "Keep character names, proper nouns, numbers and clue-critical terms consistent across all strings so the puzzle still works. " +
    "Keep the tone (literary, intriguing). Do not add or remove information. " +
    'Return ONLY a JSON object with exactly the same keys as the input and the translated strings as values.';
  let idx = 0;
  const worker = async () => {
    while (idx < chunks.length) {
      const chunk = chunks[idx++];
      const raw = await aiText({ system, user: JSON.stringify(Object.fromEntries(chunk)), json: true, tag: "[mm-translate]" });
      let parsed: Record<string, unknown> = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = {};
      }
      for (const [k] of chunk) {
        const v = parsed[k];
        if (typeof v === "string" && v.trim()) result[k] = v;
        else if (prev[k]) result[k] = prev[k];
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const missing = entries.length - Object.keys(result).length;
  if (entries.length && Object.keys(result).length === 0) throw new Error("No se pudo traducir el juego ahora mismo. Inténtalo de nuevo en unos minutos.");
  await db()
    .from("mm_translations")
    .upsert({ game_id: gameId, lang, data: result, source_hash: missing ? null : h, created_at: new Date().toISOString() });
  return { translated: Object.keys(result).length, cached: false };
}
