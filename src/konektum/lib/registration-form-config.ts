import type { FormField } from "@/konektum/components/event/RegistrationFormEditor";
import { singleAgeBand } from "./registration-quotas";

/** Only built-in age questions follow current event settings; custom questions stay intact. */
export function registrationAgeFields(fields: FormField[], ranges?: string[] | null): FormField[] {
  const single = singleAgeBand(ranges);
  return fields.filter(f => !(f.system && f.id === "preferred_age_range" && single))
    .map(f => f.system && ["age_range", "preferred_age_range"].includes(f.id) && ranges?.length
      ? { ...f, options: [...ranges] } : f);
}

export function registrationAgeValues(values: Record<string, unknown>, ranges?: string[] | null): Record<string, unknown> {
  const single = singleAgeBand(ranges);
  return single ? { ...values, preferred_age_range: single } : values;
}