import type { FormField } from "@/konektum/components/event/RegistrationFormEditor";
import { singleAgeBand, ageRangeForBirthDate } from "./registration-quotas";

/** Only built-in age questions follow current event settings; custom questions stay intact. */
export function registrationAgeFields(fields: FormField[], ranges?: string[] | null): FormField[] {
  const single = singleAgeBand(ranges);
  const hasBirthDate = fields.some(f => f.system && f.id === "birth_date");
  return fields.filter(f => !(f.system && single && (f.id === "preferred_age_range" || (f.id === "age_range" && hasBirthDate))))
    .map(f => f.system && ["age_range", "preferred_age_range"].includes(f.id) && ranges?.length
      ? { ...f, options: [...ranges] } : f);
}

export function registrationAgeValues(values: Record<string, unknown>, ranges?: string[] | null): Record<string, unknown> {
  const single = singleAgeBand(ranges);
  return single ? {
    ...values,
    preferred_age_range: single,
    ...(typeof values.birth_date === "string" ? { age_range: ageRangeForBirthDate(values.birth_date, ranges) } : {}),
  } : values;
}