import { describe, it, expect, vi } from "vitest";
vi.mock("@/konektum/supabase", () => ({ supabase: {} }));
import { enforceInclusionGroups } from "./inclusions";
const t = (...ids: string[]) => ids.map((id) => ({ id }));
describe("enforceInclusionGroups", () => {
  it("junta a una pareja separada en mesas distintas", () => {
    const rounds = [{ round: 1, tables: [t("h1", "anna", "x"), t("h2", "alessia", "y")] }];
    const failed = enforceInclusionGroups(rounds, [["anna", "alessia"]], { lockFirstSeat: true });
    expect(failed).toEqual([]);
    const at = rounds[0].tables.findIndex((tb) => tb.some((p) => p.id === "anna"));
    expect(rounds[0].tables[at].some((p) => p.id === "alessia")).toBe(true);
    expect(rounds[0].tables.map((tb) => tb[0].id)).toEqual(["h1", "h2"]);
  });
  it("intercambia con alguien del mismo género", () => {
    const g: Record<string, string> = { a: "w", b: "w", m: "m", w: "w" };
    const rounds = [{ round: 1, tables: [t("a", "m", "w"), t("b", "z")] }];
    enforceInclusionGroups(rounds, [["a", "b"]], { parityOf: (id) => g[id] ?? "m" });
    expect(rounds[0].tables[0].map((p) => p.id)).toEqual(["a", "m", "b"]);
  });
});
