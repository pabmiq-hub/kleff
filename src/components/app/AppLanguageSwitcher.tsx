import { LOCALES, LOCALE_SHORT } from "@/i18n/config";
import { useAppLocale } from "@/i18n/app-i18n";

/** Language switcher for the private member area. */
export function AppLanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useAppLocale();
  return (
    <div className={`flex items-center gap-1 rounded-xl bg-card border-2 border-ink p-1 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
            locale === l ? "bg-ink text-cream" : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {LOCALE_SHORT[l]}
        </button>
      ))}
    </div>
  );
}
