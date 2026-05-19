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
 * Translated slug for each page in each locale. Keyed by logical page key.
 * Used by `localizedPath` so that `href("/about")` returns the right URL
 * for the active locale (e.g. `/sobre-nosotros`, `/ca/qui-som`, `/en/about`).
 *
 * Keep this in sync with:
 *   - the route file names under `src/routes/` (slug = file name)
 *   - the `slug_es`, `slug_ca`, `slug_en` columns of `content_pages`
 */
export const PAGE_SLUGS: Record<string, Record<Locale, string>> = {
  about: { es: "sobre-nosotros", ca: "qui-som", en: "about" },
  "how-it-works": { es: "como-funciona", ca: "com-funciona", en: "how-it-works" },
  contact: { es: "contacto", ca: "contacte", en: "contact" },
  media: { es: "medios", ca: "mitjans", en: "media" },
  blog: { es: "blog", ca: "blog", en: "blog" },
  clocktower: {
    es: "blood-on-the-clocktower",
    ca: "blood-on-the-clocktower",
    en: "blood-on-the-clocktower",
  },
  ludoteca: { es: "ludoteca", ca: "ludoteca", en: "ludoteca" },
  tournaments: { es: "torneos", ca: "tornejos", en: "tournaments" },
  hiddenRoles: { es: "roles-ocultos", ca: "rols-ocults", en: "hidden-roles" },
  "legal-notice": { es: "aviso-legal", ca: "avis-legal", en: "legal-notice" },
  privacy: { es: "privacidad", ca: "privacitat", en: "privacy" },
  cookies: { es: "cookies", ca: "cookies", en: "cookies" },
  terms: { es: "terminos", ca: "termes", en: "terms" },
};

/** Reverse lookup: any localized slug -> logical page key. */
const SLUG_TO_KEY: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [key, byLocale] of Object.entries(PAGE_SLUGS)) {
    out[key] = key; // accept the logical key itself
    for (const slug of Object.values(byLocale)) out[slug] = key;
  }
  return out;
})();

/**
 * Build a localized path. Accepts either a logical key (e.g. `/about`) or
 * any localized slug (e.g. `/qui-som`) and re-renders it for the target
 * locale, applying the slug translation map.
 *
 * The default locale (es) has no prefix; other locales use `/{locale}/...`.
 */
export function localizedPath(path: string, locale: Locale): string {
  if (!path || path === "/") return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  const clean = path.replace(/^\/+/, "");
  const [first, ...rest] = clean.split("/");
  const pageKey = SLUG_TO_KEY[first];
  const translated = pageKey ? PAGE_SLUGS[pageKey][locale] : first;
  const tail = rest.length ? `/${rest.join("/")}` : "";
  return locale === DEFAULT_LOCALE
    ? `/${translated}${tail}`
    : `/${locale}/${translated}${tail}`;
}
