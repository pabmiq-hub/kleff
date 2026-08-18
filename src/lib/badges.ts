/** Shared badge helpers (client + server safe). */
import type { AppLocale } from "@/i18n/app-i18n";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "legend";

export type BadgeTierDef = { tier: BadgeTier; threshold: number };

export type BadgeDef = {
  id: string;
  code: string;
  kind: "tiered" | "unique";
  grp: string;
  icon: string;
  color: string;
  name_es: string;
  name_ca: string;
  name_en: string;
  description_es: string;
  description_ca: string;
  description_en: string;
  tiers: BadgeTierDef[];
  sort_order: number;
};

export type UserBadge = {
  badge: BadgeDef;
  progress: number;
  tier: BadgeTier | null;
  unlockedAt: string | null;
  seenAt: string | null;
};

export const TIER_ORDER: BadgeTier[] = ["bronze", "silver", "gold", "platinum", "legend"];

export const TIER_LABELS: Record<BadgeTier, Record<AppLocale, string>> = {
  bronze: { es: "Bronce", ca: "Bronze", en: "Bronze" },
  silver: { es: "Plata", ca: "Plata", en: "Silver" },
  gold: { es: "Oro", ca: "Or", en: "Gold" },
  platinum: { es: "Platino", ca: "Platí", en: "Platinum" },
  legend: { es: "Leyenda", ca: "Llegenda", en: "Legend" },
};

/** Ring / accent classes per tier, using design tokens only. */
export const TIER_RING: Record<BadgeTier, string> = {
  bronze: "ring-amber-700/60",
  silver: "ring-slate-400/70",
  gold: "ring-yellow-500/70",
  platinum: "ring-cyan-400/70",
  legend: "ring-coral",
};

export const GROUP_LABELS: Record<string, Record<AppLocale, string>> = {
  participacion: { es: "Participación", ca: "Participació", en: "Participation" },
  ludoteca: { es: "Ludoteca", ca: "Ludoteca", en: "Library" },
  difusion: { es: "Difusión", ca: "Difusió", en: "Outreach" },
  referidos: { es: "Referidos", ca: "Referits", en: "Referrals" },
  organizacion: { es: "Organización", ca: "Organització", en: "Organisation" },
  torneos: { es: "Torneos", ca: "Torneigs", en: "Tournaments" },
  comunidad: { es: "Comunidad", ca: "Comunitat", en: "Community" },
  solidaridad: { es: "Solidaridad y alianzas", ca: "Solidaritat i aliances", en: "Solidarity & partners" },
  general: { es: "General", ca: "General", en: "General" },
};

export function badgeName(b: BadgeDef, locale: AppLocale): string {
  return locale === "ca" ? b.name_ca : locale === "en" ? b.name_en : b.name_es;
}

export function badgeDescription(b: BadgeDef, locale: AppLocale): string {
  return locale === "ca" ? b.description_ca : locale === "en" ? b.description_en : b.description_es;
}

/** Highest tier reached for a given progress value. */
export function tierForProgress(tiers: BadgeTierDef[], progress: number): BadgeTier | null {
  let reached: BadgeTier | null = null;
  for (const t of tiers) if (progress >= t.threshold) reached = t.tier;
  return reached;
}

export function nextTier(tiers: BadgeTierDef[], progress: number): BadgeTierDef | null {
  return tiers.find((t) => progress < t.threshold) ?? null;
}

/** Progress percentage towards the next tier (or 100 when maxed / unique unlocked). */
export function tierProgressPct(tiers: BadgeTierDef[], progress: number): number {
  if (!tiers.length) return progress > 0 ? 100 : 0;
  const next = nextTier(tiers, progress);
  if (!next) return 100;
  const current = tierForProgress(tiers, progress);
  const from = current ? (tiers.find((t) => t.tier === current)?.threshold ?? 0) : 0;
  const span = next.threshold - from;
  if (span <= 0) return 100;
  return Math.min(100, Math.max(3, Math.round(((progress - from) / span) * 100)));
}
