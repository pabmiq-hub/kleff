import { describe, expect, test } from "bun:test";
import { normalizeContestSlug, pickRaffleWinner, tally, validVotes } from "../src/lib/contests";

const ec = [{ entry_id: "a", category_id: "x" }, { entry_id: "b", category_id: "x" }, { entry_id: "a", category_id: "y" }];

describe("concurso", () => {
  test("solo cuenta votos a participantes de esa categoría", () => {
    expect(validVotes({ x: "b", y: "b" }, ec)).toEqual([{ category_id: "x", entry_id: "b" }]);
  });
  test("clasificación por categoría ordenada por votos", () => {
    const r = tally([{ id: "x", name: "X" }], ec, [{ category_id: "x", entry_id: "b" }, { category_id: "x", entry_id: "b" }, { category_id: "x", entry_id: "a" }]);
    expect(r[0].ranking).toEqual([{ entry_id: "b", votes: 2 }, { entry_id: "a", votes: 1 }]);
  });
  test("sorteo sin votantes no da ganador", () => {
    expect(pickRaffleWinner([])).toBeNull();
    expect(pickRaffleWinner(["p", "q"], () => 0.9)).toBe("q");
  });
  test("enlace sencillo", () => expect(normalizeContestSlug("Halloween 2026!")).toBe("halloween-2026"));
});
