import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppLocale } from "@/i18n/app-i18n";
import {
  badgeDescription,
  badgeName,
  GROUP_LABELS,
  nextTier,
  TIER_LABELS,
  TIER_RING,
  type UserBadge,
} from "@/lib/badges";
import { BadgeCard, BadgeGlyph } from "@/components/app/badges/BadgeIcon";
import { BadgeUnlockDialog } from "@/components/app/badges/BadgeUnlockDialog";
import { useMyBadges } from "@/components/app/badges/useMyBadges";

export const Route = createFileRoute("/app/insignias")({
  head: () => ({
    meta: [
      { title: "Insignias — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BadgesPage,
});

const TEXT = {
  es: {
    title: "Insignias",
    subtitle: "Consigue insignias participando en la vida de KLEFF.",
    loading: "Cargando insignias…",
    unlocked: "conseguidas",
    progress: "Progreso",
    next: "Siguiente nivel",
    locked: "Aún no conseguida",
    levels: "Niveles",
  },
  ca: {
    title: "Insígnies",
    subtitle: "Aconsegueix insígnies participant a la vida de KLEFF.",
    loading: "Carregant insígnies…",
    unlocked: "aconseguides",
    progress: "Progrés",
    next: "Següent nivell",
    locked: "Encara no aconseguida",
    levels: "Nivells",
  },
  en: {
    title: "Badges",
    subtitle: "Earn badges by taking part in KLEFF life.",
    loading: "Loading badges…",
    unlocked: "earned",
    progress: "Progress",
    next: "Next level",
    locked: "Not earned yet",
    levels: "Levels",
  },
} as const;

function BadgesPage() {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  const { items, pending, dismissFirst } = useMyBadges();
  const [selected, setSelected] = useState<UserBadge | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, UserBadge[]>();
    for (const it of items ?? []) {
      const list = map.get(it.badge.grp) ?? [];
      list.push(it);
      map.set(it.badge.grp, list);
    }
    return [...map.entries()];
  }, [items]);

  const unlockedCount = (items ?? []).filter((b) => b.unlockedAt).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">
          {t.subtitle}
          {items ? ` · ${unlockedCount}/${items.length} ${t.unlocked}` : ""}
        </p>
      </header>

      {!items && <p className="text-muted-foreground">{t.loading}</p>}

      {groups.map(([grp, list]) => (
        <section key={grp} className="space-y-3">
          <h2 className="font-display text-xl font-bold">
            {GROUP_LABELS[grp]?.[locale] ?? grp}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((it) => (
              <BadgeCard key={it.badge.id} item={it} onClick={() => setSelected(it)} />
            ))}
          </div>
        </section>
      ))}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {badgeName(selected.badge, locale)}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-start gap-4">
                <BadgeGlyph
                  icon={selected.badge.icon}
                  unlocked={!!selected.unlockedAt}
                  size="lg"
                  tierRing={selected.tier ? TIER_RING[selected.tier] : "ring-coral/50"}
                />
                <div className="min-w-0 text-sm">
                  <p className="text-muted-foreground">
                    {badgeDescription(selected.badge, locale)}
                  </p>
                  <p className="mt-2 font-semibold">
                    {selected.tier
                      ? TIER_LABELS[selected.tier][locale]
                      : selected.unlockedAt
                        ? "✓"
                        : t.locked}
                  </p>
                  {selected.badge.tiers.length > 0 && (
                    <p className="text-muted-foreground mt-1">
                      {t.progress}: {selected.progress}
                      {nextTier(selected.badge.tiers, selected.progress)
                        ? ` / ${nextTier(selected.badge.tiers, selected.progress)!.threshold} (${t.next})`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              {selected.badge.tiers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.levels}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selected.badge.tiers.map((tier) => (
                      <li key={tier.tier} className="flex items-center justify-between gap-3">
                        <span
                          className={
                            selected.progress >= tier.threshold
                              ? "font-semibold text-coral-deep"
                              : "text-muted-foreground"
                          }
                        >
                          {TIER_LABELS[tier.tier][locale]}
                        </span>
                        <span className="text-muted-foreground">{tier.threshold}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <BadgeUnlockDialog item={pending[0] ?? null} open={pending.length > 0} onClose={dismissFirst} />
    </div>
  );
}
