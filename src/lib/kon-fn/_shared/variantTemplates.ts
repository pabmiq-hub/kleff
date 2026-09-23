// Helpers to resolve per-link (primary / secondary) event name and email templates.
// The secondary bundle only stores overrides; anything missing falls back to the primary one.

export type EventVariant = "primary" | "secondary";

export function participantVariant(participant: any): EventVariant {
  return participant?.registration_variant === "secondary" ? "secondary" : "primary";
}

/** Event title shown to the audience that used a given link. */
export function variantEventName(event: any, variant: EventVariant): string {
  const secondary = typeof event?.secondary_event_name === "string" ? event.secondary_event_name.trim() : "";
  if (variant === "secondary" && secondary) return secondary;
  return event?.name ?? "";
}

/** Communication templates for a given link, merging the secondary overrides over the base ones. */
export function variantTemplates(emailTemplate: any, variant: EventVariant): any {
  const base = emailTemplate?.communication_templates_v2 || emailTemplate || {};
  if (variant !== "secondary") return base;
  const overrides = emailTemplate?.communication_templates_v2_secondary;
  if (!overrides || typeof overrides !== "object") return base;

  const merged: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      merged[key] = { ...(base as any)[key], ...value };
    } else if (value !== undefined && value !== null && value !== "") {
      merged[key] = value;
    }
  }
  return merged;
}
