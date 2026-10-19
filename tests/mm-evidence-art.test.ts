import { describe, expect, test } from "bun:test";
import { EVIDENCE_ART_SYSTEM, EVIDENCE_KINDS, evidenceArtKind, evidenceArtPrompt } from "../src/lib/mm/evidence-art";
import { sanitizeSvg } from "../src/lib/mm/item-art";
import { mmImportSchema } from "../src/lib/mm/import-schema";

describe("Ilustraciones de evidencias", () => {
  test("usa reveal_style cuando nombra un tipo conocido", () => {
    for (const kind of EVIDENCE_KINDS) expect(evidenceArtKind({ title: "Algo", reveal_style: kind.toUpperCase() })).toBe(kind);
  });
  test("deduce el tipo del título y cae en documento", () => {
    expect(evidenceArtKind({ title: "Foto de grupo, 23:00" })).toBe("polaroid");
    expect(evidenceArtKind({ title: "El índice del Libro Negro" })).toBe("ledger");
    expect(evidenceArtKind({ title: "Registro eléctrico: pico de las 23:38" })).toBe("ledger");
    expect(evidenceArtKind({ title: "Circuitos del Ala Este" })).toBe("plan");
    expect(evidenceArtKind({ title: "Huellas reveladas" })).toBe("trace");
    expect(evidenceArtKind({ title: "Algo sin pistas", content: "Texto sin palabras clave" })).toBe("document");
  });
  test("ignora estilos de revelado que no son un tipo de objeto", () => {
    expect(evidenceArtKind({ title: "Nota del cuaderno", reveal_style: "page_write_on" })).toBe("note");
  });
  test("el encargo incluye título, tipo y texto, y prohíbe revelar al culpable", () => {
    const { kind, user } = evidenceArtPrompt({ title: "Vitrina forzada", content: "La cerradura era de juguete.", reveal_style: "photo", scope: "common" });
    expect(kind).toBe("photo");
    expect(user).toContain("Vitrina forzada");
    expect(user).toContain("La cerradura era de juguete.");
    expect(user).toContain("shared case file");
    expect(EVIDENCE_ART_SYSTEM).toContain("Never reveal who the culprit is");
  });
  test("el texto de la evidencia se recorta para no inflar el encargo", () => {
    const { user } = evidenceArtPrompt({ title: "Largo", content: "x".repeat(5000) });
    expect(user.length).toBeLessThan(1500);
  });
  test("solo acepta SVG autocontenidos y sin scripts", () => {
    const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240"><rect width="360" height="240" fill="#2b2019"/></svg>';
    expect(sanitizeSvg(`Aquí está: ${ok}`)).toBe(ok);
    expect(sanitizeSvg('<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>')).toBeNull();
    expect(sanitizeSvg('<svg viewBox="0 0 1 1"><image href="https://x.test/a.png"/></svg>')).toBeNull();
    expect(sanitizeSvg(null)).toBeNull();
  });
  test("el importador conserva la imagen que trae la evidencia en el JSON", () => {
    const img = "data:image/svg+xml;base64,PHN2Zy8+";
    const game = mmImportSchema.parse({
      game: { slug: "prueba", title: "Prueba", min_players: 1, max_players: 1, duration_minutes: 10 },
      acts: [{ key: "intro", name: "Inicio", duration_minutes: 10 }],
      characters: [{ ref: "a", name: "A", is_killer: true }],
      evidences: [{ ref: "ev", title: "Foto", scope: "common", reveal_style: "polaroid", image_url: img }],
    });
    expect(game.evidences[0].image_url).toBe(img);
    expect(game.evidences[0].reveal_style).toBe("polaroid");
  });
});
