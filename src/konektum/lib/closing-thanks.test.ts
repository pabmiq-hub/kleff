import { describe, expect, it } from "vitest";
import { renderClosingThanksEmail, KON_GOOGLE_REVIEW_URL } from "./closing-thanks";

const base = {
  name: "Laura Pérez", eventName: "Slow Friending", hours: 48,
  deadline: new Date("2026-11-12T22:30:00Z"), selectionUrl: "https://kleff.es/event/x/access", isEn: false,
};

describe("closing thanks email", () => {
  it("includes the chosen hours and Madrid deadline", () => {
    const { subject, html } = renderClosingThanksEmail(base);
    expect(subject).toContain("48h");
    expect(html).toContain("48 horas");
    expect(html).toContain("23:30");
  });
  it("links to the Google review page and the selection panel", () => {
    const { html } = renderClosingThanksEmail(base);
    expect(html).toContain(KON_GOOGLE_REVIEW_URL);
    expect(html).toContain("https://kleff.es/event/x/access");
  });
});
