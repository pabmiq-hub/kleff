export const LOCALES = ["es", "en", "ca"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  ca: "Català",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  ca: "CA",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Build a localized path. The default locale (es) has no prefix.
 * Other locales use /{locale}/...
 */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean === "/" ? "/" : clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
