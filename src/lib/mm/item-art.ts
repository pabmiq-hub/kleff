// Shared, browser-safe helpers for Juegos visuals (avatars + item art).

const AVATAR_META_KEYS = new Set(["style", "avatar_note", "avatar_opacity", "note", "notes", "seed"]);

/** DiceBear needs every option as an array; JSON from external tools often sends scalars. */
export function normalizeAvatarConfig(config: unknown): Record<string, unknown> {
  if (!config || typeof config !== "object" || Array.isArray(config)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config as Record<string, unknown>)) {
    if (AVATAR_META_KEYS.has(k) || v == null || v === "") continue;
    if (k.endsWith("Probability") || k === "flip" || k === "radius" || k === "scale" || k === "rotate") out[k] = v;
    else if (typeof v === "string") out[k] = [v.replace(/^#/, "")];
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === "string" ? x.replace(/^#/, "") : x));
    else out[k] = v;
  }
  // Colour options in DiceBear are hex without '#'; probabilities default to showing chosen accessories.
  if (out.accessories && out.accessoriesProbability === undefined) out.accessoriesProbability = 100;
  if (out.facialHair && out.facialHairProbability === undefined) out.facialHairProbability = 100;
  return out;
}

export type ItemCategory = "money" | "key" | "document" | "potion" | "weapon" | "tool" | "jewel" | "object";

const RULES: [ItemCategory, RegExp][] = [
  ["key", /llave|clave|key|candado|lock|clau/i],
  ["document", /carta|diario|nota|documento|testamento|libro|mapa|papel|expediente|contrato|letter|diary|note|book|map|paper|foto|photo|recibo|ticket|billete/i],
  ["potion", /frasco|veneno|poci[oó]n|botella|vial|sangre|ampolla|l[aá]udano|elixir|medicina|p[ií]ldora|potion|poison|bottle|blood|vino|wine/i],
  ["weapon", /estaca|cuchillo|daga|pistola|rev[oó]lver|espada|bala|arma|hacha|knife|dagger|gun|sword|stake|axe/i],
  ["jewel", /anillo|collar|joya|medall[oó]n|colgante|broche|diamante|rub[ií]|ring|necklace|jewel|amulet|amuleto|cruz|crucifijo/i],
  ["tool", /l[aá]mpara|linterna|lupa|c[aá]mara|reloj|vela|herramienta|lamp|lantern|camera|watch|candle|tool|espejo|mirror/i],
];

export function itemCategory(item: { type?: string | null; name?: string | null; description?: string | null }): ItemCategory {
  if (item.type === "money") return "money";
  const text = `${item.name ?? ""} ${item.description ?? ""}`;
  for (const [cat, re] of RULES) if (re.test(item.name ?? "")) return cat;
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return "object";
}

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  money: "Dinero",
  key: "Llave",
  document: "Documento",
  potion: "Frasco",
  weapon: "Arma",
  tool: "Herramienta",
  jewel: "Joya",
  object: "Objeto",
};

/** Accept only a self-contained, script-free SVG produced by the model. */
export function sanitizeSvg(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  const svg = m[0];
  if (/<script|<foreignObject|\son\w+\s*=|javascript:|xlink:href\s*=\s*["']https?:|href\s*=\s*["']https?:/i.test(svg)) return null;
  if (svg.length > 20000) return null;
  return svg;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
