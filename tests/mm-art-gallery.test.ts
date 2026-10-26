import { beforeEach, describe, expect, mock, test } from "bun:test";

let answer: string | null = null;
mock.module("../src/lib/ai.server", () => ({ aiText: async () => answer }));
const { getGameArt, regenerateGameArt } = await import("../src/lib/mm/art-gallery.server");

type Row = Record<string, any>;
const gameId = "10000000-0000-4000-8000-000000000001";
const otherGame = "10000000-0000-4000-8000-000000000002";
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240"><rect/><circle/><path d="M0 0"/><ellipse/></svg>';
let tables: Record<string, Row[]>;
let writes: { table: string; id: string }[];
const db = () => ({
  from(table: string) {
    let rows = tables[table] ?? [];
    let patch: Row | undefined;
    const result = (single = false) => {
      if (patch) for (const row of rows) { Object.assign(row, patch); writes.push({ table, id: row.id }); }
      return { data: single ? rows[0] ?? null : rows, error: null };
    };
    const q: any = {
      select: () => q,
      order: () => q,
      eq: (key: string, value: any) => { rows = rows.filter((r) => r[key] === value); return q; },
      in: (key: string, values: any[]) => { rows = rows.filter((r) => values.includes(r[key])); return q; },
      update: (value: Row) => { patch = value; return q; },
      single: async () => result(true),
      then: (resolve: (value: unknown) => void) => Promise.resolve(result()).then(resolve),
    };
    return q;
  },
});

beforeEach(() => {
  answer = svg;
  writes = [];
  tables = {
    mm_games: [{ id: gameId, title: "Castillo", map_url: "original-map" }],
    mm_characters: [{ id: "char", game_id: gameId, name: "Mina" }, { id: "other-char", game_id: otherGame, name: "Otra" }],
    mm_items: [{ id: "item", character_id: "char", name: "Llave", image_url: "original-item" }, { id: "other-item", character_id: "other-char", name: "Ajeno", image_url: "other-item" }],
    mm_evidences: [{ id: "evidence", game_id: gameId, title: "Carta", image_url: "original-evidence", scope: "personal", target_character_id: "char" }, { id: "other-evidence", game_id: otherGame, title: "Ajena", image_url: "other-evidence" }],
    mm_locations: [{ id: "room", game_id: gameId, name: "Salón", x: 30, y: 30, image_url: "original-room" }, { id: "other-room", game_id: otherGame, name: "Otra", x: 70, y: 70, image_url: "other-room" }],
    mm_location_features: [{ id: "feature", game_id: gameId, location_id: "room", name: "Retrato", content: "Un retrato", image_url: "original-feature" }, { id: "other-feature", game_id: otherGame, location_id: "other-room", name: "Ajeno", content: "Otro", image_url: "other-feature" }],
  };
});

describe("galería y regeneración individual", () => {
  test("incluye objetos, evidencias, plano, salas y elementos solo del juego", async () => {
    const art = await getGameArt(db, gameId);
    expect(art.map((a) => a.kind)).toEqual(["item", "evidence", "map", "location", "feature"]);
    expect(art.map((a) => a.image_url)).toEqual(["original-item", "original-evidence", "original-map", "original-room", "original-feature"]);
    expect(art.find((a) => a.kind === "evidence")?.context).toBe("Personal · Mina");
  });
  for (const [kind, table, artId] of [["item", "mm_items", "item"], ["evidence", "mm_evidences", "evidence"], ["map", "mm_games", gameId], ["location", "mm_locations", "room"], ["feature", "mm_location_features", "feature"]] as const) {
    test(`regenera solo ${kind}, sin sustituir los demás dibujos`, async () => {
      if (kind === "map") answer = svg.replace("360 240", "640 400").replace("<ellipse/>", "<ellipse/><rect/><circle/>");
      const before = JSON.stringify(tables);
      await regenerateGameArt(db, { gameId, kind, artId });
      expect(writes).toEqual([{ table, id: artId }]);
      expect(JSON.stringify(tables)).not.toBe(before);
    });
    test(`conserva ${kind} si Gemini no devuelve un dibujo válido`, async () => {
      answer = null;
      const before = JSON.stringify(tables);
      await expect(regenerateGameArt(db, { gameId, kind, artId })).rejects.toThrow();
      expect(writes).toEqual([]);
      expect(JSON.stringify(tables)).toBe(before);
    });
  }
  for (const [kind, artId] of [["item", "other-item"], ["evidence", "other-evidence"], ["location", "other-room"], ["feature", "other-feature"], ["map", otherGame]] as const) {
    test(`rechaza ${kind} de otro juego`, async () => {
      await expect(regenerateGameArt(db, { gameId, kind, artId })).rejects.toThrow();
      expect(writes).toEqual([]);
    });
  }
});