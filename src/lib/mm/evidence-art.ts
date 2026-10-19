// Shared, browser-safe helpers for tangible evidence illustrations in Juegos.
// Pure functions only (no server imports) so they can be unit tested.

export const EVIDENCE_KINDS = ["polaroid", "photo", "document", "ledger", "note", "plan", "graph", "timeline", "trace", "sketch", "lab"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

const KIND_BRIEF: Record<EvidenceKind, string> = {
  polaroid: "An instant photo (white polaroid frame, slightly rotated, two pieces of tape on top). Inside: a simple flat scene of what the evidence shows. Handwritten caption of at most 3 words below the picture.",
  photo: "A forensic photograph (white polaroid frame, tape) of the place or object described, with one or two yellow numbered evidence markers.",
  document: "A typed or handwritten sheet of aged paper with ruled lines, a paperclip, a coffee stain and 3 to 6 short lines of text. Optional red stamp.",
  ledger: "An open ledger or register (two pages, dark leather cover with a thin gold border). Short rows of text; if something is missing or torn out, draw a ragged torn edge.",
  note: "A small note or torn page with a few handwritten words, the object it talks about drawn next to it, and a paperclip.",
  plan: "A blueprint: dark-blue paper, thin grid, rooms drawn with white lines, the relevant circuit or route highlighted in orange, short labels.",
  graph: "A monitor-style chart on a dark green screen with a grid and one clear spike labelled with its value and its time.",
  timeline: "A paper card with a vertical dotted line, 3 to 5 red dots and one short time + event per dot.",
  trace: "A close-up scene of a trace: footprints, smell wisps or dust marks on a surface, with the object that holds it.",
  sketch: "A pencil-style sketch card of what a witness saw or heard (silhouettes, sound waves), with times.",
  lab: "A transparent evidence bag with a red PRUEBA seal strip, the object or sample inside and a label with 2 to 4 words.",
};

const INFER: [EvidenceKind, RegExp][] = [
  ["polaroid", /foto|fotograf|polaroid|retrato|imagen/i],
  ["ledger", /libro|registro|[ií]ndice|expediente|contabilidad|reservas|ledger|book/i],
  ["plan", /plano|esquema|circuito|mapa|blueprint|plan\b/i],
  ["graph", /gr[aá]fic|pico|consumo|potencia|lectura|chart/i],
  ["timeline", /cronolog|cotejo|l[ií]nea de tiempo|timeline/i],
  ["lab", /an[aá]lisis|laboratorio|muestra|ceniza|forense|autopsia|frasco|veneno/i],
  ["trace", /rastro|huella|olor|pisada|marca/i],
  ["sketch", /silueta|testimonio|risa|grito|vi[oó]|oy[oó]|boceto/i],
  ["note", /nota|cuaderno|carta|mensaje|conversaci[oó]n|tel[eé]fono|albar[aá]n|recibo/i],
];

/** The kind comes from the JSON's reveal_style when it names one; otherwise it is inferred from the text. */
export function evidenceArtKind(e: { title?: string | null; content?: string | null; reveal_style?: string | null }): EvidenceKind {
  const style = (e.reveal_style ?? "").trim().toLowerCase();
  if ((EVIDENCE_KINDS as readonly string[]).includes(style)) return style as EvidenceKind;
  const text = `${e.title ?? ""} ${(e.content ?? "").slice(0, 300)}`;
  for (const [kind, re] of INFER) if (re.test(e.title ?? "")) return kind;
  for (const [kind, re] of INFER) if (re.test(text)) return kind;
  return "document";
}

export const EVIDENCE_ART_SYSTEM = `You are an illustrator making tangible investigation evidence for a cartoon murder-mystery party game.
Match the flat cartoon look of the game's avatars and item icons: bold clean shapes, flat fills, thin dark outlines (#262E33), a muted dark palette with warm accents, no gradients except one optional soft highlight.
Return ONLY one SVG element with viewBox="0 0 360 240", width="360" height="240".
Background: a dark wooden table (#2B2019) with a few faint horizontal grain lines. Show ONE physical object seen from above, slightly rotated (between -4 and 4 degrees), with a soft drop shadow, filling about 70% of the canvas.
Text: only short labels in Spanish (max 6 lines, max 5 words per line, font-family Courier New, monospace or Georgia, serif). Make sure every label fits inside its object; never let text run off the edge.
Draw what the evidence describes and nothing else. Never reveal who the culprit is, never draw faces, never add text that is not in the evidence.
At most ~60 shapes. Never use <script>, <image>, <foreignObject>, external links, web fonts or event attributes.`;

export function evidenceArtPrompt(e: { title: string; content?: string | null; reveal_style?: string | null; scope?: string | null }): { kind: EvidenceKind; user: string } {
  const kind = evidenceArtKind(e);
  const user = [
    `Evidence title: ${e.title}`,
    `Kind of object: ${kind}. ${KIND_BRIEF[kind]}`,
    `What it shows (game text, Spanish): ${(e.content ?? "").slice(0, 600) || "(no description)"}`,
    `Visibility: ${e.scope === "personal" ? "personal clue held by one player" : "shared case file"}`,
  ].join("\n");
  return { kind, user };
}
