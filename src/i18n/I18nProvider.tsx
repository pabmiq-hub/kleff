import { createContext, useContext, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { DEFAULT_LOCALE, isLocale, localizedPath, type Locale } from "./config";
import { dictionaries, type Dict } from "./dictionaries";

type I18nContextValue = {
  locale: Locale;
  t: Dict;
  /** Build a localized path that respects the current locale */
  href: (path: string) => string;
  /** Build a path for a specific locale (used by language switcher) */
  hrefFor: (path: string, locale: Locale) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const locale = detectLocaleFromPath(pathname);
  const t = dictionaries[locale];

  const value: I18nContextValue = {
    locale,
    t,
    href: (path: string) => localizedPath(path, locale),
    hrefFor: (path: string, target: Locale) => localizedPath(path, target),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/**
 * Strips the locale prefix and returns the "logical" path.
 * /en/about -> /about, /ca -> /, / -> /
 */
export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (isLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

export function detectLocaleFromPath(pathname: string): Locale {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) return parts[0];
  return DEFAULT_LOCALE;
}
