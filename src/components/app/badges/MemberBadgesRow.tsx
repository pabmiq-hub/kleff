import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMemberBadges } from "@/lib/badges.functions";
import { badgeName, TIER_LABELS, TIER_RING, type UserBadge } from "@/lib/badges";
import { BadgeGlyph } from "./BadgeIcon";
import { useAppLocale } from "@/i18n/app-i18n";

const TITLE = { es: "Insignias", ca: "Insígnies", en: "Badges" } as const;

/** Unlocked badges of another member, shown in their community profile. */
export function MemberBadgesRow({ userId }: { userId: string }) {
  const fn = useServerFn(getMemberBadges);
  const { locale } = useAppLocale();
  const [items, setItems] = useState<UserBadge[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fn({ data: { userId } })
      .then((r) => {
        if (!cancelled) setItems(r.badges as unknown as UserBadge[]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fn, userId]);

  if (!items.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {TITLE[locale as keyof typeof TITLE] ?? TITLE.es}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((b) => (
          <div
            key={b.badge.id}
            title={`${badgeName(b.badge, locale)}${b.tier ? ` · ${TIER_LABELS[b.tier][locale]}` : ""}`}
          >
            <BadgeGlyph
              icon={b.badge.icon}
              unlocked
              size="sm"
              tierRing={b.tier ? TIER_RING[b.tier] : "ring-coral/50"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
