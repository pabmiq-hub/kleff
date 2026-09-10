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
