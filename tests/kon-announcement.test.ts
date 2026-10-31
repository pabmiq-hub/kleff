import { describe, expect, test } from "bun:test";
import { hasAnnouncementText, renderAnnouncementEmail, sanitizeAnnouncementHtml } from "../src/konektum/lib/announcement";

describe("Konektum comunicado", () => {
  test("keeps bold, italic and https links", () => {
    const out = sanitizeAnnouncementHtml('<p><strong>Hola</strong> <em>a todos</em> <a href="https://kleff.es" onclick="x()">aquí</a></p>');
    expect(out).toContain("<strong>Hola</strong>");
    expect(out).toContain("<em>a todos</em>");
    expect(out).toContain('href="https://kleff.es"');
    expect(out).not.toContain("onclick");
  });
  test("removes scripts and javascript links", () => {
    const out = sanitizeAnnouncementHtml('<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("<img");
  });
  test("empty paragraphs are not text", () => {
    expect(hasAnnouncementText("<p></p><p><br></p>")).toBe(false);
    expect(hasAnnouncementText("<p>Hola</p>")).toBe(true);
  });
  test("cancel block only when a cancel link is given", () => {
    const withCancel = renderAnnouncementEmail({ subject: "T", bodyHtml: "<p>x</p>", cancelUrl: "https://kleff.es/event/1/cancel/2?token=a", participantName: "Ana" }).html;
    expect(withCancel).toContain("Darme de baja del evento");
    expect(withCancel).toContain("hola@kleff.es");
    expect(withCancel).toContain("¡Hola Ana!");
    const without = renderAnnouncementEmail({ subject: "T", bodyHtml: "<p>x</p>", cancelUrl: null }).html;
    expect(without).not.toContain("Darme de baja del evento");
  });
});
