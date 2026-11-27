import { afterEach, describe, expect, it, vi } from "vitest";
import { readTableUndo, writeTableUndo, restoreTableRound, sameTableState, type TableRound } from "./tableUndo";

const before: TableRound = { round: 2, tables: [[{ id: "anna", name: "Anna" }], [{ id: "alessia", name: "Alessia" }]] };
const after: TableRound = { round: 2, tables: [[{ id: "anna", name: "Anna" }, { id: "alessia", name: "Alessia" }], []] };
const entry = { round: 2, before, after };

describe("undo table edits", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("restores the last saved seating change in round 2", () => {
    expect(restoreTableRound([after], entry)).toEqual([before]);
  });
  it("preserves changes in other rounds", () => {
    const third = { round: 3, tables: [[{ id: "new", name: "New participant" }]] };
    expect(restoreTableRound([after, third], entry)).toEqual([before, third]);
  });
  it("refuses to overwrite a subsequent edit to the same round", () => {
    expect(restoreTableRound([{ ...after, tables: [] }], entry)).toBeNull();
  });
  it("refuses undo if the round has been deleted", () => {
    expect(restoreTableRound([], entry)).toBeNull();
  });
  it("ignores JSON object key ordering but preserves seating order", () => {
    expect(sameTableState({ tables: after.tables, round: 2 }, after)).toBe(true);
    expect(sameTableState(after.tables, [...after.tables].reverse())).toBe(false);
  });
  it("retains the last saved change on reload and isolates events", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("sessionStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    writeTableUndo("event-one", { "2": entry });
    expect(readTableUndo("event-one")).toEqual({ "2": entry });
    expect(readTableUndo("event-two")).toEqual({});
    writeTableUndo("event-one", {});
    expect(readTableUndo("event-one")).toEqual({});
  });
  it("ignores invalid browser snapshots", () => {
    vi.stubGlobal("sessionStorage", { getItem: () => "invalid" });
    expect(readTableUndo("event-one")).toEqual({});
  });
});