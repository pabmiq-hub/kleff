// @ts-nocheck
// Shared language helpers: normalize a mix of codes/labels into Spanish labels.

export const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: "es", label: "Castellano" },
  { code: "ca", label: "Català" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
];

export const LANG_MAP: Record<string, string> = {
  es: "Castellano", castellano: "Castellano", spanish: "Castellano", "español": "Castellano",
  ca: "Català", catala: "Català", "català": "Català", catalan: "Català",
  en: "English", english: "English", "inglés": "English", ingles: "English",
  pt: "Português", portugues: "Português", "português": "Português", portuguese: "Português",
  fr: "Français", francais: "Français", "français": "Français", french: "Français",
};

export const normalizeLanguageLabel = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  if (!key) return null;
  return LANG_MAP[key] || String(raw).trim();
};

export const normalizeLanguages = (langs: string[] | null | undefined): string[] => {
  if (!langs) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of langs) {
    const label = normalizeLanguageLabel(raw);
    if (!label) continue;
    const dedupeKey = label.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(label);
  }
  return out;
};
