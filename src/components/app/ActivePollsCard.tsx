import { Link } from "@tanstack/react-router";
import { usePolls } from "@/components/app/PollCard";
import { Vote, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppLocale, pickLocalized } from "@/i18n/app-i18n";
import { pollsDict } from "@/i18n/app/polls";

const DATE_LOCALE: Record<string, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

/** Bloque del dashboard: solo aparece si hay encuestas o votaciones abiertas. */
export function ActivePollsCard() {
  const { locale } = useAppLocale();
  const t = pollsDict[locale].activePolls;
  const { polls, loading } = usePolls();
  if (loading) return null;
  const active = polls.filter((p) => p.open);
  if (active.length === 0) return null;

  return (
    <section className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm space-y-3">
      <header className="flex items-center gap-2">
        <Vote className="h-5 w-5 text-coral-deep" />
        <h2 className="font-display text-xl font-bold">{t.title}</h2>
      </header>
      <ul className="space-y-2">
        {active.map((p) => {
          const title = pickLocalized(locale, { es: p.title, ca: p.titleCa, en: p.titleEn });
          return (
            <li key={p.id}>
              <Link
                to="/app/votaciones"
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 p-3 hover:bg-cream-deep/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.kind === "survey" ? t.surveyLabel : t.acquisitionLabel}
                    {p.closesAt
                      ? ` · ${t.closesOn} ${new Date(p.closesAt).toLocaleDateString(DATE_LOCALE[locale] ?? "es-ES", { day: "numeric", month: "short" })}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.participated ? (
                    <Badge variant="secondary">{t.participated}</Badge>
                  ) : (
                    <Badge className="bg-coral-deep text-cream">{t.pending}</Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
