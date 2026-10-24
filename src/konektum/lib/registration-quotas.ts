/** Shared registration/administration rules; display language is not identity. */
export function normalizeQuotaKey(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, "");
}

export function genderKey(value: unknown): string {
  const key = normalizeQuotaKey(value);
  const aliases: Record<string, string> = {
    hombre: "man", man: "man", mujer: "woman", woman: "woman",
    nobinario: "non-binary", "non-binary": "non-binary", nonbinary: "non-binary",
    prefieronodecirlo: "prefer-not-to-say", prefernottosay: "prefer-not-to-say",
  };
  return aliases[key] ?? key;
}

export function genderLabel(value: unknown, lang: string = "es"): string {
  const labels: Record<string, [string, string]> = {
    man: ["Hombre", "Man"], woman: ["Mujer", "Woman"],
    "non-binary": ["No binario", "Non-binary"],
    "prefer-not-to-say": ["Prefiero no decirlo", "Prefer not to say"],
  };
  return labels[genderKey(value)]?.[lang === "en" ? 1 : 0] ?? String(value ?? "");
}

export function uniqueGenderLabels(values: unknown[], lang: string = "es"): string[] {
  return [...new Map(values.filter(Boolean).map(v => [genderKey(v), genderLabel(v, lang)])).values()];
}

type AgeBand = string | { label?: string; min: number; max?: number };
type Profile = {
  gender?: string | null; birth_date?: string | null; age_range?: string | null;
  cancelled_at?: unknown; is_fake?: boolean | null;
};
export type RegistrationQuota = { gender: string; ageRange: string; maxSlots: number };

export function parseAgeBand(raw: AgeBand): { label: string; min: number; max: number } | null {
  if (typeof raw === "object" && raw !== null) {
    return { label: raw.label ?? String(raw.min), min: raw.min, max: raw.max ?? Infinity };
  }
  const label = String(raw).trim();
  const key = normalizeQuotaKey(label);
  const plus = key.match(/^(?:(\d+)\+|\+(\d+))$/);
  if (plus) return { label, min: Number(plus[1] ?? plus[2]), max: Infinity };
  const range = key.match(/^(\d+)-(\d+)$/);
  if (!range) return null;
  return { label, min: Number(range[1]), max: Number(range[2]) };
}

export function singleAgeBand(ranges: AgeBand[] | null | undefined): string | null {
  return ranges?.length === 1 ? parseAgeBand(ranges[0])?.label ?? null : null;
}

export function ageRangeForBirthDate(birthDate: string, ranges?: AgeBand[] | null, today = new Date()): string {
  const birth = new Date(`${birthDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(birth.getTime())) return "Otro";
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth() ||
      (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  const bands = ranges?.length ? ranges : ["18-24", "25-32", "33-40", "41-50", "50+"];
  for (const raw of bands) {
    const band = parseAgeBand(raw);
    if (band && age >= band.min && age <= band.max) return band.label;
  }
  return "Otro";
}

/** Reclassify old registrations against CURRENT bands without rewriting history. */
export function profileAgeRange(profile: Profile, ranges?: AgeBand[] | null, today = new Date()): string {
  if (profile.birth_date) return ageRangeForBirthDate(profile.birth_date, ranges, today);
  const single = singleAgeBand(ranges);
  const old = profile.age_range ? parseAgeBand(profile.age_range) : null;
  const current = single ? parseAgeBand(single) : null;
  if (old && current && old.min >= current.min && old.max <= current.max) return current.label;
  return profile.age_range ?? "Otro";
}

/** On collapse to one band, retain the total of distinct old-band capacities.
 * Translated duplicates of the SAME gender/band are one quota, never two. */
export function synchronizeQuotas(quotas: RegistrationQuota[], ranges?: AgeBand[] | null): RegistrationQuota[] {
  const single = singleAgeBand(ranges);
  const distinct = new Map<string, RegistrationQuota>();
  for (const quota of quotas) {
    const key = `${genderKey(quota.gender)}:${normalizeQuotaKey(quota.ageRange)}`;
    const prior = distinct.get(key);
    distinct.set(key, { ...quota, gender: prior?.gender ?? quota.gender, maxSlots: Math.max(prior?.maxSlots ?? 0, quota.maxSlots) });
  }
  if (!single) return [...distinct.values()];
  const merged = new Map<string, RegistrationQuota>();
  for (const quota of distinct.values()) {
    const key = genderKey(quota.gender);
    const prior = merged.get(key);
    merged.set(key, { gender: prior?.gender ?? quota.gender, ageRange: single, maxSlots: (prior?.maxSlots ?? 0) + quota.maxSlots });
  }
  return [...merged.values()];
}

export function matchingQuota(quotas: RegistrationQuota[], profile: Profile, ranges?: AgeBand[] | null, today = new Date()) {
  const age = profileAgeRange(profile, ranges, today);
  return synchronizeQuotas(quotas, ranges).find(q =>
    genderKey(q.gender) === genderKey(profile.gender) && normalizeQuotaKey(q.ageRange) === normalizeQuotaKey(age));
}

export function countQuotaParticipants(people: Profile[], quota: RegistrationQuota, ranges?: AgeBand[] | null, today = new Date()): number {
  return people.filter(p => !p.cancelled_at && !p.is_fake &&
    genderKey(p.gender) === genderKey(quota.gender) &&
    normalizeQuotaKey(profileAgeRange(p, ranges, today)) === normalizeQuotaKey(quota.ageRange)).length;
}

/** Hidden single-band preference is derived, never a stale answer from the form. */
export function effectivePreferredAgeRange(value: string | null | undefined, ranges?: AgeBand[] | null): string | null {
  return singleAgeBand(ranges) ?? value ?? null;
}