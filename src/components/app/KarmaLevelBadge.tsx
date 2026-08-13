import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { getMyKarmaSummary } from "@/lib/karma.functions";
import { levelForKarma } from "@/lib/karma-levels";
import { useAppLocale } from "@/i18n/app-i18n";
import { accountDict } from "@/i18n/app/account";

type Variant = "light" | "dark";

/** Level badge for the signed-in member (carnet + profile). */
export function KarmaLevelBadge({ variant = "light" }: { variant?: Variant }) {
  const fn = useServerFn(getMyKarmaSummary);
  const [summary, setSummary] = useState<{ balance: number; lifetime: number } | null>(null);
  const { locale } = useAppLocale();
  const t = accountDict[locale];

  useEffect(() => {
    let cancelled = false;
    void fn({ data: undefined as never })
      .then((r) => {
        if (!cancelled) setSummary(r);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fn]);

  if (!summary) return null;
  const level = levelForKarma(summary.lifetime);

  const styles =
    variant === "dark"
      ? "bg-cream/15 text-cream border-cream/30"
      : "bg-coral/15 text-ink border-coral/40";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
      title={t.karmaBadge.tooltip(summary.lifetime)}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {level.name}
      <span className="opacity-70">· {summary.balance} {t.karmaBadge.points}</span>
    </span>
  );
}
