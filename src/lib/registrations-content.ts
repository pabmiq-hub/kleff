// Client-safe helpers for the public content of native registration forms:
// highlight rows ("categorías") and the default legal text.

export type HighlightRow = {
  emoji: string;
  label: string;
  text: string;
};

export const HIGHLIGHT_PRESETS: ReadonlyArray<{ emoji: string; label: string }> = [
  { emoji: "📍", label: "Lugar" },
  { emoji: "💶", label: "Precio" },
  { emoji: "🗓", label: "Fecha" },
  { emoji: "👥", label: "Plazas" },
  { emoji: "🗣", label: "Idiomas" },
  { emoji: "⏰", label: "Horario" },
  { emoji: "🎲", label: "Juegos" },
];

export const DEFAULT_LEGAL_HTML = `<p><strong>Protección de datos.</strong> Los datos que facilitas en este formulario los trata KLEFF con la única finalidad de gestionar tu inscripción y comunicarte información sobre la actividad. No se ceden a terceros. Puedes ejercer tus derechos de acceso, rectificación y supresión escribiendo a <a href="mailto:info@kleff.es">info@kleff.es</a>.</p>
<p><strong>Imágenes.</strong> Durante la actividad podemos tomar fotografías o vídeos con fines de difusión del club. Si no quieres aparecer, indícanoslo al llegar y lo respetaremos.</p>
<p><strong>Condiciones de asistencia.</strong> Las plazas son limitadas y se asignan por orden de inscripción. Si no puedes venir, anula tu inscripción desde el enlace del correo de confirmación para liberar la plaza. KLEFF puede modificar o cancelar la actividad avisando por correo.</p>`;

export function isHighlightRow(v: unknown): v is HighlightRow {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r["label"] === "string" && typeof r["text"] === "string";
}

export function normalizeHighlights(value: unknown): HighlightRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isHighlightRow).map((r) => ({
    emoji: typeof r.emoji === "string" ? r.emoji : "",
    label: r.label,
    text: r.text,
  }));
}

/** Turns legacy plain-text descriptions into simple paragraphs. */
export function plainTextToHtml(text: string): string {
  const escape = (t: string) =>
    t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const html = escape(block)
        .replace(/&lt;br\s*\/?&gt;/gi, "<br />")
        .replace(/\n/g, "<br />");
      return `<p>${html}</p>`;
    })
    .join("");
}

/** Structured info blocks stored alongside highlight rows (kind:"section"); old readers skip them. */
export type EventSectionKey = "how" | "important";
export type EventSections = Record<EventSectionKey, string>;

export function readEventSections(value: unknown): EventSections {
  const out: EventSections = { how: "", important: "" };
  if (!Array.isArray(value)) return out;
  for (const v of value) {
    if (v && typeof v === "object" && (v as any).kind === "section" && typeof (v as any).html === "string") {
      const k = (v as any).key;
      if (k === "how" || k === "important") out[k as EventSectionKey] = (v as any).html;
    }
  }
  return out;
}

export function mergeEventSections(rows: HighlightRow[], sections: EventSections): unknown[] {
  const isEmpty = (h: string) => !h.replace(/<[^>]*>|&nbsp;/g, "").trim();
  const extra = (Object.keys(sections) as EventSectionKey[])
    .filter((k) => !isEmpty(sections[k]))
    .map((k) => ({ kind: "section", key: k, html: sections[k] }));
  return [...rows, ...extra];
}
