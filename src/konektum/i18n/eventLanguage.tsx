import type { Language } from "./translations";

const key = (eventId: string) => `kon_event_lang_${eventId}`;

/** Idioma efectivo: el elegido por el participante si el admin lo permite; si no, el del evento. */
export function resolveEventLang(eventLanguage: unknown, choiceEnabled: unknown, stored: unknown): Language {
  const base: Language = eventLanguage === "en" ? "en" : "es";
  if (choiceEnabled !== true) return base;
  return stored === "en" || stored === "es" ? stored : base;
}

export function readStoredEventLang(eventId?: string | null): string | null {
  if (!eventId || typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key(eventId)); } catch { return null; }
}

export function storeEventLang(eventId: string | null | undefined, lang: Language) {
  if (!eventId || typeof window === "undefined") return;
  try { window.localStorage.setItem(key(eventId), lang); } catch { /* ignore */ }
}

export function EventLangSwitch({ lang, onChange }: { lang: Language; onChange: (l: Language) => void }) {
  return (
    <div
      className="fixed top-3 right-3 z-[100] flex rounded-full border border-border bg-card/95 p-0.5 text-xs font-semibold shadow-sm backdrop-blur"
      role="group"
      aria-label={lang === "en" ? "Language" : "Idioma"}
    >
      {(["es", "en"] as Language[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1 transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
