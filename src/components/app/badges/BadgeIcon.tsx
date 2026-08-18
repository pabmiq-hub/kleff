import { icons, Award, Lock } from "lucide-react";
import {
  badgeName,
  nextTier,
  tierProgressPct,
  TIER_LABELS,
  TIER_RING,
  type UserBadge,
} from "@/lib/badges";
import { useAppLocale } from "@/i18n/app-i18n";
import { cn } from "@/lib/utils";

function toPascal(name: string) {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export function BadgeGlyph({
  icon,
  unlocked,
  size = "md",
  tierRing,
}: {
  icon: string;
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
  tierRing?: string;
}) {
  const Icon = (icons as Record<string, typeof Award>)[toPascal(icon)] ?? Award;
  const box = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const glyph = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all",
        box,
        unlocked
          ? cn("border-ink bg-primary-soft/50 text-coral-deep shadow-tactile-sm ring-2", tierRing)
          : "border-ink/15 bg-muted/50 text-muted-foreground grayscale",
      )}
    >
      <Icon className={glyph} />
      {!unlocked && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-card border border-ink/20 p-1">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}

/** Card with glyph, name, tier and progress bar. */
export function BadgeCard({ item, onClick }: { item: UserBadge; onClick?: () => void }) {
  const { locale } = useAppLocale();
  const unlocked = !!item.unlockedAt;
  const tiers = item.badge.tiers ?? [];
  const next = nextTier(tiers, item.progress);
  const pct = tierProgressPct(tiers, item.progress);

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full bg-card border-2 border-ink rounded-2xl p-4 shadow-tactile-sm hover:shadow-tactile transition-shadow flex gap-3 items-start"
    >
      <BadgeGlyph
        icon={item.badge.icon}
        unlocked={unlocked}
        tierRing={item.tier ? TIER_RING[item.tier] : "ring-coral/50"}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold truncate", !unlocked && "text-muted-foreground")}>
          {badgeName(item.badge, locale)}
        </p>
        {item.tier && (
          <span className="inline-block mt-0.5 text-xs font-semibold text-coral-deep">
            {TIER_LABELS[item.tier][locale]}
          </span>
        )}
        {tiers.length > 0 && (
          <>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full", unlocked ? "bg-coral" : "bg-ink/25")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {next ? `${item.progress} / ${next.threshold}` : `${item.progress} ✓`}
            </p>
          </>
        )}
      </div>
    </button>
  );
}
