import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/i18n/I18nProvider";

const STORAGE_KEY = "kleff-cookie-consent";
const OPEN_EVENT = "kleff:open-cookie-settings";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: 1;
};

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const COPY = {
  es: {
    banner: "Usamos cookies propias y de terceros para que la web funcione, recordar tus preferencias y, si aceptas, medir el uso de forma anónima para mejorarla.",
    accept: "Aceptar todas",
    reject: "Rechazar",
    configure: "Configurar",
    more: "Más información",
    title: "Preferencias de cookies",
    desc: "Elige qué cookies quieres permitir. Puedes cambiar esta configuración en cualquier momento desde el pie de página.",
    necessaryTitle: "Estrictamente necesarias",
    necessaryDesc: "Imprescindibles para que la web funcione (sesión, seguridad, recordar tus preferencias).",
    analyticsTitle: "Analíticas",
    analyticsDesc: "Nos ayudan a entender, de forma agregada y anónima, cómo se usa la web para mejorarla.",
    marketingTitle: "Marketing",
    marketingDesc: "Permiten mostrar contenidos o anuncios más relevantes en sitios de terceros.",
    save: "Guardar preferencias",
    acceptAll: "Aceptar todas",
    rejectAll: "Rechazar todas",
    always: "Siempre activas",
    policyHref: "/cookies",
  },
  en: {
    banner: "We use our own and third-party cookies to make the site work, remember your preferences and, if you agree, measure usage anonymously to improve it.",
    accept: "Accept all",
    reject: "Reject",
    configure: "Configure",
    more: "Learn more",
    title: "Cookie preferences",
    desc: "Choose which cookies you allow. You can change this at any time from the footer.",
    necessaryTitle: "Strictly necessary",
    necessaryDesc: "Required for the site to work (session, security, remembering your preferences).",
    analyticsTitle: "Analytics",
    analyticsDesc: "Help us understand, anonymously and in aggregate, how the site is used so we can improve it.",
    marketingTitle: "Marketing",
    marketingDesc: "Allow showing more relevant content or ads on third-party sites.",
    save: "Save preferences",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    always: "Always active",
    policyHref: "/cookies",
  },
  ca: {
    banner: "Fem servir galetes pròpies i de tercers perquè la web funcioni, recordar les teves preferències i, si ho acceptes, mesurar-ne l'ús de manera anònima per millorar-la.",
    accept: "Acceptar-les totes",
    reject: "Rebutjar",
    configure: "Configurar",
    more: "Més informació",
    title: "Preferències de galetes",
    desc: "Tria quines galetes vols permetre. Pots canviar aquesta configuració en qualsevol moment des del peu.",
    necessaryTitle: "Estrictament necessàries",
    necessaryDesc: "Imprescindibles perquè la web funcioni (sessió, seguretat, recordar preferències).",
    analyticsTitle: "Analítiques",
    analyticsDesc: "Ens ajuden a entendre, de manera agregada i anònima, com s'usa la web per millorar-la.",
    marketingTitle: "Màrqueting",
    marketingDesc: "Permeten mostrar continguts o anuncis més rellevants en llocs de tercers.",
    save: "Desar preferències",
    acceptAll: "Acceptar-les totes",
    rejectAll: "Rebutjar-les totes",
    always: "Sempre actives",
    policyHref: "/cookies",
  },
};

export function CookieConsent() {
  const { locale, href } = useI18n();
  const t = COPY[locale] ?? COPY.es;

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false); // dialog open
  const [bannerVisible, setBannerVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getCookieConsent();
    if (!existing) {
      setBannerVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
    const onOpen = () => {
      const cur = getCookieConsent();
      if (cur) {
        setAnalytics(cur.analytics);
        setMarketing(cur.marketing);
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  function save(consent: { analytics: boolean; marketing: boolean }) {
    const payload: CookieConsent = {
      necessary: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      timestamp: new Date().toISOString(),
      version: 1,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);
    setBannerVisible(false);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("kleff:cookie-consent-changed", { detail: payload }));
  }

  if (!mounted) return null;

  return (
    <>
      {bannerVisible && !open && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t.title}
          className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md"
        >
          <div className="rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-5 shadow-2xl">
            <p className="text-sm text-foreground/85 leading-relaxed">
              {t.banner}{" "}
              <Link to={href(t.policyHref)} className="text-coral-deep underline underline-offset-2 hover:no-underline">
                {t.more}
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:shadow-warm transition-all"
              >
                {t.accept}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {t.reject}
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {t.configure}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/60 backdrop-blur-sm p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border/70 overflow-hidden"
          >
            <div className="p-6 border-b border-border/60">
              <h2 className="text-xl font-display font-semibold text-foreground">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-6 space-y-4">
              <CategoryRow
                title={t.necessaryTitle}
                desc={t.necessaryDesc}
                checked
                disabled
                badge={t.always}
                onChange={() => undefined}
              />
              <CategoryRow
                title={t.analyticsTitle}
                desc={t.analyticsDesc}
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title={t.marketingTitle}
                desc={t.marketingDesc}
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
            <div className="p-6 border-t border-border/60 flex flex-wrap gap-2 justify-end bg-muted/30">
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {t.rejectAll}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics, marketing })}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:shadow-warm transition-all"
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryRow({
  title,
  desc,
  checked,
  disabled,
  badge,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 p-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <label className="inline-flex items-center cursor-pointer select-none mt-1">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`relative h-6 w-11 rounded-full transition-colors ${
            disabled ? "bg-coral/50 cursor-not-allowed" : checked ? "bg-coral" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </span>
      </label>
    </div>
  );
}
