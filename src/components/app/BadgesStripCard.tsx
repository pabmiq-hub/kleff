import { Award, Lock } from "lucide-react";
import { useAppLocale } from "@/i18n/app-i18n";

const TEXT = {
  es: { title: "Insignias", soon: "Muy pronto: consigue insignias por participar en KLEFF.", locked: "Bloqueada" },
  ca: { title: "Insígnies", soon: "Molt aviat: aconsegueix insígnies per participar a KLEFF.", locked: "Bloquejada" },
  en: { title: "Badges", soon: "Coming soon: earn badges for taking part in KLEFF.", locked: "Locked" },
} as const;

/** Placeholder strip reserving the space for the upcoming badge system. */
export function BadgesStripCard() {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  return (
    <section className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm">
      <div className="flex items-center gap-2 text-coral-deep font-semibold">
        <Award className="h-5 w-5" /> {t.title}
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 h-16 w-16 rounded-2xl border-2 border-dashed border-ink/20 bg-muted/40 flex items-center justify-center text-muted-foreground"
            title={t.locked}
          >
            <Lock className="h-5 w-5" />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-3">{t.soon}</p>
    </section>
  );
}
