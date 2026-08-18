import { Link } from "@tanstack/react-router";
import { Award, ArrowRight } from "lucide-react";
import { useAppLocale } from "@/i18n/app-i18n";
import { badgeName, TIER_RING } from "@/lib/badges";
import { BadgeGlyph } from "./badges/BadgeIcon";
import { BadgeUnlockDialog } from "./badges/BadgeUnlockDialog";
import { useMyBadges } from "./badges/useMyBadges";

const TEXT = {
  es: { title: "Mis insignias", all: "Ver todas", unlocked: "conseguidas", loading: "Cargando…" },
  ca: { title: "Les meves insígnies", all: "Veure-les totes", unlocked: "aconseguides", loading: "Carregant…" },
  en: { title: "My badges", all: "See all", unlocked: "earned", loading: "Loading…" },
} as const;

export function BadgesStripCard() {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  const { items, pending, dismissFirst } = useMyBadges();

  const unlocked = (items ?? []).filter((b) => b.unlockedAt);
  const locked = (items ?? []).filter((b) => !b.unlockedAt);
  const strip = [...unlocked, ...locked].slice(0, 12);

  return (
    <section className="bg-card border-2 border-ink rounded-2xl p-5 shadow-tactile-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-coral-deep font-semibold">
          <Award className="h-5 w-5" /> {t.title}
          {items && (
            <span className="text-muted-foreground font-normal text-sm">
              · {unlocked.length}/{items.length} {t.unlocked}
            </span>
          )}
        </div>
        <Link
          to="/app/insignias"
          className="inline-flex items-center gap-1 text-sm font-medium text-coral-deep hover:underline"
        >
          {t.all} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {!items && <p className="text-sm text-muted-foreground">{t.loading}</p>}
        {strip.map((b) => (
          <div key={b.badge.id} title={badgeName(b.badge, locale)}>
            <BadgeGlyph
              icon={b.badge.icon}
              unlocked={!!b.unlockedAt}
              size="sm"
              tierRing={b.tier ? TIER_RING[b.tier] : "ring-coral/50"}
            />
          </div>
        ))}
      </div>

      <BadgeUnlockDialog item={pending[0] ?? null} open={pending.length > 0} onClose={dismissFirst} />
    </section>
  );
}
