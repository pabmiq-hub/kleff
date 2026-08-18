import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Award, Loader2, Minus, Plus } from "lucide-react";
import { getMemberBadgesAdmin, setMemberBadgeProgress } from "@/lib/badges.functions";
import {
  GROUP_LABELS,
  TIER_LABELS,
  TIER_RING,
  badgeName,
  nextTier,
  type BadgeDef,
  type BadgeTier,
  type BadgeTierDef,
} from "@/lib/badges";
import { BadgeGlyph } from "@/components/app/badges/BadgeIcon";
import { Button } from "@/components/ui/button";

type AdminBadge = BadgeDef & { source: string | null; auto_metric: string | null };
type Row = {
  badge: AdminBadge;
  progress: number;
  tier: BadgeTier | null;
  unlockedAt: string | null;
};

function targetLabel(tiers: BadgeTierDef[], progress: number): string {
  const next = nextTier(tiers, progress);
  if (!tiers.length) return progress > 0 ? "Conseguida" : "Bloqueada";
  if (!next) return "Nivel máximo";
  return `Siguiente: ${TIER_LABELS[next.tier].es} (${next.threshold})`;
}

/** Super-admin panel to award or adjust a member's badges. */
export function MemberBadgesAdmin({ userId }: { userId: string }) {
  const loadFn = useServerFn(getMemberBadgesAdmin);
  const saveFn = useServerFn(setMemberBadgeProgress);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await loadFn({ data: { userId } });
      setRows(r.badges as unknown as Row[]);
    } catch {
      setRows([]);
    }
  }, [loadFn, userId]);

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  const update = async (row: Row, progress: number) => {
    if (progress < 0) return;
    setSaving(row.badge.id);
    try {
      await saveFn({ data: { userId, badgeId: row.badge.id, progress } });
      toast.success(`${badgeName(row.badge, "es")} actualizada`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setSaving(null);
    }
  };

  if (rows === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando insignias…
      </div>
    );
  }

  const manual = rows.filter((r) => !r.badge.auto_metric);
  const visible = showAll ? rows : manual;

  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-ink/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-lg">
          <Award className="h-4 w-4 text-coral" /> Insignias
        </p>
        <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Solo manuales" : "Ver todas"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-ink/50">
        Las automáticas se calculan solas; aquí puedes otorgar o ajustar las manuales.
      </p>

      <ul className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
        {visible.map((row) => {
          const auto = !!row.badge.auto_metric;
          const tiered = row.badge.kind === "tiered";
          const busy = saving === row.badge.id;
          return (
            <li
              key={row.badge.id}
              className="flex items-center gap-3 rounded-xl border border-ink/10 bg-cream px-3 py-2"
            >
              <BadgeGlyph
                icon={row.badge.icon}
                unlocked={!!row.unlockedAt}
                size="sm"
                tierRing={row.tier ? TIER_RING[row.tier] : "ring-coral/40"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{badgeName(row.badge, "es")}</p>
                <p className="truncate text-xs text-ink/50">
                  {GROUP_LABELS[row.badge.grp]?.es ?? row.badge.grp}
                  {tiered ? ` · ${row.progress} · ${targetLabel(row.badge.tiers, row.progress)}` : ""}
                  {auto ? " · automática" : ""}
                </p>
              </div>
              {auto ? (
                <span className="shrink-0 text-xs text-ink/40">auto</span>
              ) : tiered ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={busy || row.progress <= 0}
                    onClick={() => void update(row, row.progress - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-mono text-sm">{row.progress}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={busy}
                    onClick={() => void update(row, row.progress + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant={row.unlockedAt ? "outline" : "default"}
                  size="sm"
                  className="shrink-0"
                  disabled={busy}
                  onClick={() => void update(row, row.unlockedAt ? 0 : 1)}
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : row.unlockedAt ? "Quitar" : "Otorgar"}
                </Button>
              )}
            </li>
          );
        })}
        {visible.length === 0 && <li className="text-xs text-ink/50">No hay insignias.</li>}
      </ul>
    </div>
  );
}
