import { describe, expect, test } from "bun:test";
import {
  participantVariant,
  variantEventName,
  variantTemplates,
} from "@/lib/kon-fn/_shared/variantTemplates";

const event = {
  name: "Slow Friending Lúdico [Mujer+ Mujer] 🌈 - Octubre",
  secondary_event_name: "Slow Friending Lúdico [Hombre + Hombre] 🌈",
};

const emailTemplate = {
  communication_templates_v2: {
    matches: { subject: "Matches en {{evento}}", greeting: "Hola" },
    matches_without: { subject: "Gracias por venir a {{evento}}" },
  },
  communication_templates_v2_secondary: {
    matches: { subject: "Matches chicos en {{evento}}" },
  },
};

describe("variantEventName", () => {
  test("primary participants get the main event name", () => {
    expect(variantEventName(event, "primary")).toBe(event.name);
  });

  test("secondary participants get the secondary event name", () => {
    expect(variantEventName(event, "secondary")).toBe(event.secondary_event_name);
  });

  test("secondary falls back to the main name when no secondary name is set", () => {
    expect(variantEventName({ name: "Solo" }, "secondary")).toBe("Solo");
  });
});

describe("participantVariant", () => {
  test("maps registration_variant to the event variant", () => {
    expect(participantVariant({ registration_variant: "secondary" })).toBe("secondary");
    expect(participantVariant({ registration_variant: "primary" })).toBe("primary");
    expect(participantVariant({})).toBe("primary");
  });
});

describe("variantTemplates", () => {
  test("primary gets the base templates untouched", () => {
    const t = variantTemplates(emailTemplate, "primary");
    expect(t.matches.subject).toBe("Matches en {{evento}}");
  });

  test("secondary overrides only the keys it defines", () => {
    const t = variantTemplates(emailTemplate, "secondary");
    expect(t.matches.subject).toBe("Matches chicos en {{evento}}");
    expect(t.matches.greeting).toBe("Hola");
    expect(t.matches_without.subject).toBe("Gracias por venir a {{evento}}");
  });

  test("secondary without overrides falls back to the base templates", () => {
    const t = variantTemplates({ communication_templates_v2: emailTemplate.communication_templates_v2 }, "secondary");
    expect(t.matches.subject).toBe("Matches en {{evento}}");
  });
});
