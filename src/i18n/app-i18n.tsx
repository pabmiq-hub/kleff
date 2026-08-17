import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./config";

export type AppLocale = Locale;

const STORAGE_KEY = "kleff.app.locale";

type Ctx = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  ready: boolean;
};

const AppLocaleContext = createContext<Ctx | null>(null);

export function readStoredAppLocale(): AppLocale | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as AppLocale) : null;
}

export function storeAppLocale(l: AppLocale) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
}

/**
 * Locale of the private member area (independent from the public site locale).
 * Persisted in localStorage and, for signed-in members, in their profile.
 */
export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredAppLocale();
    if (stored) setLocaleState(stored);
    setReady(true);

    // Sync with the member profile (only when signed in). DB wins on first load.
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;
        const { getMyLocale } = await import("@/lib/locale.functions");
        const res = await getMyLocale({ data: undefined as never });
        if (res?.locale && (LOCALES as readonly string[]).includes(res.locale)) {
          setLocaleState(res.locale as AppLocale);
          storeAppLocale(res.locale as AppLocale);
        }
      } catch {
        /* ignore */
      }
    })();

  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    storeAppLocale(l);
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;
        const { updateMyLocale } = await import("@/lib/locale.functions");
        await updateMyLocale({ data: { locale: l } });
      } catch {
        /* ignore */
      }
    })();

  }, []);

  return (
    <AppLocaleContext.Provider value={{ locale, setLocale, ready }}>
      {children}
    </AppLocaleContext.Provider>
  );
}

export function useAppLocale(): Ctx {
  const ctx = useContext(AppLocaleContext);
  if (!ctx) return { locale: DEFAULT_LOCALE, setLocale: () => {}, ready: true };
  return ctx;
}

/** Pick a localized value from a { es, ca, en } record, falling back to Spanish. */
export function pickLocalized(
  locale: AppLocale,
  values: { es?: string | null; ca?: string | null; en?: string | null },
): string {
  return (values[locale] || values.es || values.en || values.ca || "") as string;
}
