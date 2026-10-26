import { describe, expect, test } from "bun:test";
import { EXAMINE_ERRORS, examineBlock, evidenceGoesTo, fallbackMapSvg, locationsOverlap, pinPosition, validateArtSvg } from "../src/lib/mm/map-art";
import { mmImportSchema } from "../src/lib/mm/import-schema";

const ctx = { running: true, hasCharacter: true, available: true, characterRef: "frank", itemKeys: ["it_llavero", "Llavero"], abilityKeys: ["ab_oido"] };

describe("examinar elementos del mapa", () => {
  test("requisito de otro personaje", () => expect(examineBlock({ character: "vanhelsing" }, ctx)).toBe(EXAMINE_ERRORS.notYou));
  test("«cualquiera» lo puede examinar", () => expect(examineBlock({ character: "cualquiera" }, ctx)).toBeNull());
  test("falta objeto", () => expect(examineBlock({ item: "it_pistola" }, ctx)).toBe(EXAMINE_ERRORS.noItem));
  test("objeto por nombre", () => expect(examineBlock({ item: "llavero" }, ctx)).toBeNull());
  test("falta habilidad", () => expect(examineBlock({ ability: "ab_vuelo" }, ctx)).toBe(EXAMINE_ERRORS.noAbility));
  test("acto no alcanzado", () => expect(examineBlock({}, { ...ctx, available: false })).toBe(EXAMINE_ERRORS.notYet));
  test("partida no en curso", () => expect(examineBlock({}, { ...ctx, running: false })).toBe(EXAMINE_ERRORS.notYet));
});

describe("pruebas personales", () => {
  test("común llega a todos", () => expect(evidenceGoesTo({ scope: "common", target_character_id: null }, "a")).toBe(true));
  test("personal solo al destinatario", () => {
    expect(evidenceGoesTo({ scope: "personal", target_character_id: "a" }, "a")).toBe(true);
    expect(evidenceGoesTo({ scope: "personal", target_character_id: "a" }, "b")).toBe(false);
  });
});

describe("plano", () => {
  test("chincheta desplazada y dentro del plano", () => {
    expect(pinPosition(50, 50)).toEqual({ left: 42.5, top: 43 });
    expect(pinPosition(2, 2)).toEqual({ left: 3, top: 5 });
  });
  test("solapamiento 22/18", () => {
    expect(locationsOverlap({ x: 10, y: 10 }, { x: 31, y: 27 })).toBe(true);
    expect(locationsOverlap({ x: 10, y: 10 }, { x: 32, y: 10 })).toBe(false);
  });
  test("el plano de respaldo pasa la validación", () => {
    const svg = fallbackMapSvg([{ name: "Gran salón", x: 20, y: 30 }, { name: "Biblioteca del conde", x: 60, y: 30 }, { name: "Cripta", x: 40, y: 75 }]);
    expect(validateArtSvg(svg, { viewBox: "0 0 640 400", minShapes: 6 }).ok).toBe(true);
  });
  test("rechaza SVG con script, viewBox erróneo o mal formado", () => {
    const ok = '<svg viewBox="0 0 360 240"><rect/><rect/><circle/><path d="M0 0"/></svg>';
    const r = validateArtSvg(ok, { viewBox: "0 0 360 240", minShapes: 4 });
    expect(r.ok && r.svg.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(validateArtSvg(ok.replace("<rect/>", "<script>x</script>"), { viewBox: "0 0 360 240", minShapes: 3 }).ok).toBe(false);
    expect(validateArtSvg(ok, { viewBox: "0 0 640 400", minShapes: 4 }).ok).toBe(false);
    expect(validateArtSvg(ok.replace("<rect/>", "<g><rect/>"), { viewBox: "0 0 360 240", minShapes: 4 }).ok).toBe(false);
    expect(validateArtSvg('<svg viewBox="0 0 360 240"><rect fill="url(https://x.com/a)"/><rect/><rect/><rect/></svg>', { viewBox: "0 0 360 240", minShapes: 4 }).ok).toBe(false);
  });
});

const base = () => ({
  game: { slug: "test-map", title: "T", min_players: 2, max_players: 3, duration_minutes: 60 },
  acts: [{ key: "intro", name: "I", duration_minutes: 10 }, { key: "investigation", name: "II", duration_minutes: 10 }],
  characters: [
    { ref: "frank", name: "Frank", is_killer: true, items: [{ ref: "it_llavero", name: "Llavero" }] },
    { ref: "mina", name: "Mina" },
  ],
  evidences: [{ ref: "ev_1", title: "Prueba" }],
  locations: [
    { ref: "salon", name: "Salón", x: 20, y: 30, act: "investigation", features: [{ ref: "f1", name: "Retrato", content: "Texto", requires: { item: "it_llavero" }, evidence: "ev_1" }] },
    { ref: "cripta", name: "Cripta", x: 70, y: 70 },
  ],
});

describe("importación de lugares", () => {
  test("JSON válido", () => expect(mmImportSchema.safeParse(base()).success).toBe(true));
  const fails = (mut: (j: any) => void) => {
    const j: any = base();
    mut(j);
    return !mmImportSchema.safeParse(j).success;
  };
  test("ref de lugar repetido", () => expect(fails((j) => (j.locations[1].ref = "salon"))).toBe(true));
  test("lugares demasiado cerca", () => expect(fails((j) => Object.assign(j.locations[1], { x: 30, y: 40 }))).toBe(true));
  test("elemento en acto anterior a su lugar", () => expect(fails((j) => (j.locations[0].features[0].act = "intro"))).toBe(true));
  test("prueba inexistente", () => expect(fails((j) => (j.locations[0].features[0].evidence = "ev_x"))).toBe(true));
  test("personaje inexistente", () => expect(fails((j) => (j.locations[0].features[0].requires = { character: "drac" }))).toBe(true));
  test("objeto inexistente", () => expect(fails((j) => (j.locations[0].features[0].requires = { item: "pistola" }))).toBe(true));
  test("habilidad inexistente", () => expect(fails((j) => (j.locations[0].features[0].requires = { ability: "vuelo" }))).toBe(true));
  test("elemento sin content", () => expect(fails((j) => delete j.locations[0].features[0].content)).toBe(true));
});
