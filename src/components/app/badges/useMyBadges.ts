import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyBadges, markBadgesSeen } from "@/lib/badges.functions";
import type { UserBadge } from "@/lib/badges";

/** Loads the caller's badge catalogue and surfaces freshly unlocked ones. */
export function useMyBadges() {
  const fn = useServerFn(getMyBadges);
  const seenFn = useServerFn(markBadgesSeen);
  const [items, setItems] = useState<UserBadge[] | null>(null);
  const [pending, setPending] = useState<UserBadge[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fn({ data: undefined as never })
      .then((r) => {
        if (cancelled) return;
        const list = r.badges as unknown as UserBadge[];
        setItems(list);
        setPending(list.filter((b) => b.unlockedAt && !b.seenAt));
      })
      .catch(() => setItems([]));
    return () => {
      cancelled = true;
    };
  }, [fn]);

  const dismissFirst = useCallback(() => {
    setPending((prev) => {
      const [first, ...rest] = prev;
      if (first) void seenFn({ data: { badgeIds: [first.badge.id] } }).catch(() => undefined);
      return rest;
    });
  }, [seenFn]);

  return { items, pending, dismissFirst };
}
