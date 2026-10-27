import { describe, expect, test } from "bun:test";
import { isCharacterTab, playerMainTabs, playerSection, votingPrompt } from "../src/lib/mm/player-navigation";

describe("player navigation", () => {
  test("a game with a map keeps five main sections", () => {
    expect(playerMainTabs(true)).toEqual(["personaje", "inventario", "evidencias", "mapa", "acciones"]);
  });
  test("a game without a map keeps four main sections", () => {
    expect(playerMainTabs(false)).toEqual(["personaje", "inventario", "evidencias", "acciones"]);
  });
  test("role, secrets and objectives all belong to Character", () => {
    for (const id of ["personaje", "secretos", "objetivos"] as const) {
      expect(isCharacterTab(id)).toBe(true);
      expect(playerSection(id)).toBe("personaje");
    }
    expect(isCharacterTab("inventario")).toBe(false);
    expect(playerSection("inventario")).toBe("inventario");
  });
  test("accusation never becomes a main navigation section", () => {
    expect(playerSection("acusacion")).toBeNull();
  });
  test("closed voting without a vote has no prompt", () => {
    expect(votingPrompt(false, false)).toBeNull();
  });
  test("opening voting shows the accusation prompt", () => {
    expect(votingPrompt(true, false)).toBe("accuse");
  });
  test("a submitted vote replaces the accusation prompt with its receipt", () => {
    expect(votingPrompt(true, true)).toBe("recorded");
    expect(votingPrompt(false, true)).toBe("recorded");
  });
});