import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeGlyph } from "./BadgeIcon";
import { badgeDescription, badgeName, TIER_LABELS, TIER_RING, type UserBadge } from "@/lib/badges";
import { useAppLocale } from "@/i18n/app-i18n";

const TEXT = {
  es: { title: "¡Insignia desbloqueada!", close: "¡Genial!" },
  ca: { title: "Insígnia desbloquejada!", close: "Genial!" },
  en: { title: "Badge unlocked!", close: "Awesome!" },
} as const;

export function BadgeUnlockDialog({
  item,
  open,
  onClose,
}: {
  item: UserBadge | null;
  open: boolean;
  onClose: () => void;
}) {
  const { locale } = useAppLocale();
  const t = TEXT[locale as keyof typeof TEXT] ?? TEXT.es;
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="font-display text-xl font-bold text-coral-deep">{t.title}</p>
          <BadgeGlyph
            icon={item.badge.icon}
            unlocked
            size="lg"
            tierRing={item.tier ? TIER_RING[item.tier] : "ring-coral"}
          />
          <div>
            <p className="font-semibold text-lg">{badgeName(item.badge, locale)}</p>
            {item.tier && (
              <p className="text-sm font-semibold text-coral-deep">{TIER_LABELS[item.tier][locale]}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {badgeDescription(item.badge, locale)}
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
