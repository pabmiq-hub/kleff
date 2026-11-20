// @ts-nocheck
import { describe, expect, it } from "vitest";
import { DEFAULT_CONNECTION_MISSIONS, defaultMissions, nicknameKey, pickMissions, pickTicket } from "./retos";

describe("retos", () => {
  it("incluye las 30 misiones de conexión predefinidas", () => {
    expect(DEFAULT_CONNECTION_MISSIONS).toHaveLength(30);
    expect(defaultMissions().filter((m) => m.category === "conexion")).toHaveLength(30);
  });
  it("asigna 3 misiones distintas a cada persona", () => {
    const pool = Array.from({ length: 30 }, (_, i) => ({ id: String(i) }));
    const picked = pickMissions(pool, new Map(), 3);
    expect(new Set(picked.map((p) => p.id)).size).toBe(3);
  });
  it("pseudónimos repetidos chocan aunque cambien tildes o mayúsculas", () => {
    expect(nicknameKey("  Peñá  Lópe ")).toBe(nicknameKey("pena lope"));
  });
  it("un número ya premiado no vuelve a salir", () => {
    const t = [{ id: "a" }, { id: "b" }];
    expect(pickTicket(t, new Set(["a"]))?.id).toBe("b");
    expect(pickTicket(t, new Set(["a", "b"]))).toBeNull();
  });
});
