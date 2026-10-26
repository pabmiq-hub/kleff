// Browser-safe helpers for the Juegos castle map: SVG validation, Gemini prompts,
// fallback floor plan, pin placement and examine rules. Pure functions only (unit tested).

export const MAP_VIEWBOX = "0 0 640 400";
export const SCENE_VIEWBOX = "0 0 360 240";

const STYLE_RULES = `Style: flat cartoon, bold clean shapes, thin dark outlines (#262E33), a muted dark palette (night purple #1B1426,
burgundy #8B1A2B, gold #D4AF37, bone #EFE6D8) with warm accents, at most one soft highlight.
Use only these elements: svg, g, defs, linearGradient, radialGradient, stop, clipPath, path, rect, circle, ellipse,
line, polyline, polygon, text. Never use image, script, style, foreignObject, filter, animation, external links,
web fonts or event attributes.
At most about 60 shapes. Every coordinate must stay inside the viewBox. Close every shape and every tag.`;

export const MAP_ART_SYSTEM = `You are a cartographer drawing the castle plan for a cartoon murder-mystery party game.
Output exactly ONE <svg> element and nothing else: no markdown fences, no explanations, no comments.
The element must have xmlns="http://www.w3.org/2000/svg", viewBox="0 0 640 400" and width/height equal to the viewBox size.
${STYLE_RULES}
Text: only the short Spanish labels explicitly requested (at most 3 words each), font-family="Georgia, serif",
font-size between 10 and 14. A label must fit inside its shape and never overlap other text.
Draw only what is described. Never draw faces or people, never add words that are not requested, never invent
clues or reveal who is guilty.
If unsure, simplify: a clean simple drawing is better than a rich broken one.
- Room labels: at most 2 lines of at most 12 characters each, font-size 11. Split longer names at a space.
  Never let a label cross the border of its box.
- Keep each room exactly centred on the coordinates you are given. Do not move or resize rooms.
  Every room must connect to at least one neighbour through a corridor.`;

export const SCENE_ART_SYSTEM = `You are an illustrator drawing the rooms and the objects of a cartoon murder-mystery party game.
Output exactly ONE <svg> element and nothing else. The element must have xmlns="http://www.w3.org/2000/svg",
viewBox="0 0 360 240" and width="360" height="240".
${STYLE_RULES}
Never draw faces or people, never invent clues or reveal who is guilty.
Text: none. Scenes never contain text.
- Draw each named object as a simple, recognisable icon in the lower half of the picture.
  Draw nothing else except furniture typical of the room.`;

/** Extra rules shared by the evidence and item prompts. */
export const LABEL_RULES = `- When a label is requested, use the exact Spanish text from the game. Never change numbers, times or
  names. If a label would not fit at font-size 12, leave it out.
- Keep every shape inside the canvas and close every tag.`;

type Loc = { name: string; description?: string | null; x: number; y: number };
const px = (l: Loc) => ({ x: Math.round((l.x / 100) * 640), y: Math.round((l.y / 100) * 400) });

export function mapArtPrompt(game: { title: string; synopsis?: string | null }, locations: Loc[]): string {
  return [
    `Game: ${game.title}. ${(game.synopsis ?? "").slice(0, 400)}`,
    "Draw a top-down schematic floor plan of the whole place.",
    `Rooms (${locations.length}). Draw each as a rounded rectangle about 112 by 64 pixels CENTRED on the given coordinates, labelled inside with its name:`,
    ...locations.map((l, i) => {
      const p = px(l);
      return `${i + 1}. "${l.name}": centre at (${p.x}, ${p.y})${l.description ? ` — ${l.description.slice(0, 160)}` : ""}`;
    }),
    "Join the rooms with thick corridors drawn BEHIND the rooms. Keep a 14 px margin to the edge of the canvas.",
    "Do NOT draw pins, numbers, arrows or legends (the app adds its own pins). Decorations (towers, trees, a moat, tiles) go only in empty areas and must stay subtle.",
    "Background: dark parchment night (#1B1426) with a thin gold border.",
  ].join("\n");
}

export function roomArtPrompt(game: { title: string }, room: { name: string; description?: string | null }, featureNames: string[]): string {
  return [
    `Game: ${game.title}.`,
    `Room: ${room.name}. ${room.description ?? ""}`,
    `Show these objects in the room, small but recognisable: ${featureNames.slice(0, 6).join(", ") || "(none)"}.`,
    "Draw the room as a cozy gothic interior seen from the front, empty of people. No text at all.",
  ].join("\n");
}

export function featureArtPrompt(game: { title: string }, room: { name: string }, f: { name: string; teaser?: string | null; content: string }): string {
  return [
    `Game: ${game.title}. Place: ${room.name}.`,
    `Object: ${f.name}. ${f.teaser ?? ""}`,
    `What the players find when they examine it (use it only to draw the right details, never write it): ${f.content.slice(0, 420)}`,
    "Draw ONE close-up of the object, centred, on a soft dark background, lit from the side. No people and no text at all.",
  ].join("\n");
}

/* ------------------------------ SVG validation ----------------------------- */

const SHAPES = /<(path|rect|circle|ellipse|line|polyline|polygon|text)\b/gi;

/** Minimal XML well-formedness check: balanced tags, quoted attributes. */
export function isWellFormedXml(xml: string): boolean {
  const stack: string[] = [];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (xml.slice(last, m.index).includes("<")) return false; // stray or malformed tag
    last = re.lastIndex;
    if (!m[2]) continue;
    const [, close, name, , self] = m;
    if (close) {
      if (stack.pop() !== name) return false;
    } else if (!self) stack.push(name);
  }
  if (xml.slice(last).includes("<")) return false;
  return stack.length === 0;
}

export type SvgCheck = { ok: true; svg: string } | { ok: false; reason: string };

export function validateArtSvg(raw: string | null | undefined, opts: { viewBox: string; minShapes: number }): SvgCheck {
  if (!raw) return { ok: false, reason: "The answer was empty." };
  const all = raw.match(/<svg[\s\S]*?<\/svg>/gi) ?? [];
  if (all.length !== 1) return { ok: false, reason: "Return exactly one complete <svg>...</svg> element." };
  let svg = all[0];
  if (svg.length > 20000) return { ok: false, reason: "The SVG is longer than 20000 characters; simplify it." };
  if (/<script|<foreignObject|<image\b|\son\w+\s*=|javascript:|@import/i.test(svg)) return { ok: false, reason: "Forbidden content (script, foreignObject, image, event attributes, javascript: or @import)." };
  if (/(href\s*=\s*["']\s*(https?:|\/\/))|url\(\s*["']?\s*(https?:|\/\/)/i.test(svg)) return { ok: false, reason: "External links are not allowed." };
  const vb = svg.match(/<svg\b[^>]*\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().replace(/\s+/g, " ");
  if (vb !== opts.viewBox) return { ok: false, reason: `The viewBox must be exactly "${opts.viewBox}".` };
  if (!isWellFormedXml(svg)) return { ok: false, reason: "The SVG is not well-formed XML; close every tag." };
  const shapes = (svg.match(SHAPES) ?? []).length;
  if (shapes < opts.minShapes) return { ok: false, reason: `Draw at least ${opts.minShapes} shapes.` };
  if (!/<svg\b[^>]*\bxmlns\s*=/.test(svg)) svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return { ok: true, svg };
}

/* ------------------------------ Fallback plan ------------------------------ */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function labelLines(name: string): string[] {
  const words = name.split(/\s+/);
  const lines: string[] = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur) lines[lines.length - 1] = w;
    else if ((cur + " " + w).length <= 12) lines[lines.length - 1] = cur + " " + w;
    else if (lines.length < 2) lines.push(w);
    else lines[1] = (lines[1] + " " + w).slice(0, 14);
  }
  return lines.map((l) => (l.length > 14 ? l.slice(0, 13) + "…" : l));
}

/** Minimum spanning tree (Prim) over room centres: the corridor list. */
export function corridorPairs(points: { x: number; y: number }[]): [number, number][] {
  if (points.length < 2) return [];
  const inTree = new Set([0]);
  const out: [number, number][] = [];
  while (inTree.size < points.length) {
    let best: [number, number, number] | null = null;
    for (const i of inTree)
      for (let j = 0; j < points.length; j++) {
        if (inTree.has(j)) continue;
        const d = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (!best || d < best[2]) best = [i, j, d];
      }
    inTree.add(best![1]);
    out.push([best![0], best![1]]);
  }
  return out;
}

export function fallbackMapSvg(locations: Loc[]): string {
  const pts = locations.map(px);
  const corridors = corridorPairs(pts)
    .map(([a, b]) => `<line x1="${pts[a].x}" y1="${pts[a].y}" x2="${pts[b].x}" y2="${pts[b].y}" stroke="#4A3B5C" stroke-width="16" stroke-linecap="round"/>`)
    .join("");
  const rooms = locations
    .map((l, i) => {
      const p = pts[i];
      const lines = labelLines(l.name);
      const text = lines
        .map((t, k) => `<text x="${p.x}" y="${p.y + 4 + (k - (lines.length - 1) / 2) * 13}" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#EFE6D8">${esc(t)}</text>`)
        .join("");
      return `<rect x="${p.x - 56}" y="${p.y - 32}" width="112" height="64" rx="10" fill="#8B1A2B" stroke="#262E33" stroke-width="2"/>${text}`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400"><rect x="0" y="0" width="640" height="400" fill="#1B1426"/><rect x="6" y="6" width="628" height="388" rx="8" fill="none" stroke="#D4AF37" stroke-width="2"/>${corridors}${rooms}</svg>`;
}

/* ------------------------------ Pins & layout ------------------------------ */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pin at the room's top-left corner, offset (-7.5 %, -7 %), always inside the plan. */
export function pinPosition(x: number, y: number): { left: number; top: number } {
  return { left: clamp(x - 7.5, 3, 97), top: clamp(y - 7, 5, 96) };
}

/** Two places overlap when they are < 22 apart horizontally AND < 18 vertically. */
export function locationsOverlap(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < 22 && Math.abs(a.y - b.y) < 18;
}

/* ------------------------------ Examine rules ------------------------------ */

export type Requires = { character?: string | null; item?: string | null; ability?: string | null };

export type ExamineContext = {
  running: boolean;
  hasCharacter: boolean;
  available: boolean; // place and feature reached by act
  characterRef: string | null;
  itemKeys: string[]; // refs and names of items the player holds (reached)
  abilityKeys: string[]; // refs and names of the character's reached abilities
};

export const EXAMINE_ERRORS = {
  notYet: "Todavía no puedes examinar esto",
  notYou: "Esto no lo puedes examinar tú",
  noItem: "Te falta un objeto para examinar esto",
  noAbility: "Te falta una habilidad para examinar esto",
} as const;

const norm = (s: string) => s.trim().toLowerCase();

/** Returns null when the player may examine, otherwise the Spanish reason. */
export function examineBlock(req: Requires | null | undefined, ctx: ExamineContext): string | null {
  if (!ctx.running || !ctx.hasCharacter || !ctx.available) return EXAMINE_ERRORS.notYet;
  const r = req ?? {};
  if (r.character && r.character !== "cualquiera" && r.character !== ctx.characterRef) return EXAMINE_ERRORS.notYou;
  if (r.item && !ctx.itemKeys.map(norm).includes(norm(r.item))) return EXAMINE_ERRORS.noItem;
  if (r.ability && !ctx.abilityKeys.map(norm).includes(norm(r.ability))) return EXAMINE_ERRORS.noAbility;
  return null;
}

/** A personal evidence only reaches its target character. */
export function evidenceGoesTo(ev: { scope: string; target_character_id: string | null }, characterId: string | null): boolean {
  return ev.scope === "common" || (!!characterId && ev.target_character_id === characterId);
}
