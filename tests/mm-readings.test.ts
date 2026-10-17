import { describe, expect, test } from "bun:test";
import { mmImportSchema } from "../src/lib/mm/import-schema";
import { readingSchema, playerReadings } from "../src/lib/mm/readings";

const readings = [
  readingSchema.parse({ act: "intro", reader: "larry", title: "Introducción", text: "Bienvenidos" }),
  readingSchema.parse({ act: "investigation", reader: "helsing", title: "Comunicado", text: "Hay un cadáver", trigger: "murder" }),
  readingSchema.parse({ act: "conclusion", reader: "larry", title: "Solución", text: "El culpable es…" }),
];
const running = { status: "running", characters_released_at: "2026-10-17", act: { key: "intro" } };
describe("Lecturas privadas por acto", () => {
  test("entrega la introducción solo al personaje lector", () => {
    expect(playerReadings(readings, running, "larry")).toEqual([readings[0]]);
    expect(playerReadings(readings, running, "helsing")).toEqual([]);
  });
  test("no entrega lecturas antes del inicio o del reparto", () => {
    expect(playerReadings(readings, { ...running, status: "lobby" }, "larry")).toEqual([]);
    expect(playerReadings(readings, { ...running, characters_released_at: null }, "larry")).toEqual([]);
  });
  test("el comunicado espera al asesinato en investigation", () => {
    const s = { ...running, act: { key: "investigation" } };
    expect(playerReadings(readings, s, "helsing")).toEqual([]);
    expect(playerReadings(readings, { ...s, murder_triggered_at: "2026-10-17" }, "helsing")).toEqual([readings[1]]);
  });
  test("no filtra la solución durante acusaciones y votación", () => {
    expect(playerReadings(readings, { ...running, act: { key: "conclusion" } }, "larry")).toEqual([]);
    expect(playerReadings(readings, { ...running, status: "finished" }, "larry")).toEqual([]);
    expect(playerReadings(readings, { ...running, status: "finished", revealed_at: "2026-10-17" }, "larry")).toEqual([readings[2]]);
  });
  test("no muestra lecturas de actos futuros ni de anfitrión", () => {
    const host = readingSchema.parse({ act: "intro", reader: "host", title: "Anfitrión", text: "Privado" });
    expect(playerReadings([host, ...readings], running, "larry")).toEqual([readings[0]]);
  });
});
const fixture = {
  game: { slug: "test-readings", title: "Misterio", min_players: 1, max_players: 1, duration_minutes: 30 },
  acts: ["intro", "investigation", "conclusion"].map((key) => ({ key, name: key, duration_minutes: 10 })),
  characters: [{ ref: "larry", name: "Larry", is_killer: true }],
  readings: [{ act: "intro", reader: "larry", title: "Introducción", text: "Bienvenidos" }],
};
describe("Importación de lecturas", () => {
  test("conserva lecturas y referencias al importarlas", () => {
    expect(mmImportSchema.parse(fixture).readings).toEqual([readings[0]]);
  });
  test("rechaza lectores inexistentes y víctimas", () => {
    expect(mmImportSchema.safeParse({ ...fixture, readings: [{ ...fixture.readings[0], reader: "missing" }] }).success).toBe(false);
    expect(mmImportSchema.safeParse({ ...fixture, characters: [{ ...fixture.characters[0], victim: true }] }).success).toBe(false);
  });
  test("rechaza referencias a actos no incluidos", () => {
    expect(mmImportSchema.safeParse({ ...fixture, acts: fixture.acts.slice(1) }).success).toBe(false);
  });
  test("mantiene la compatibilidad con juegos sin lecturas", () => {
    expect(mmImportSchema.parse({ ...fixture, readings: undefined }).readings).toEqual([]);
  });
});