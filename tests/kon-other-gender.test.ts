import { describe, expect, test } from "bun:test";
import {
  allowsParitySeat, genderKey, otherSeatCap, parityGroup, parityTargetPerGender, withQuotaGenders,
} from "../src/konektum/lib/registration-quotas";

describe("Otro género", () => {
  test("Otro género, Other gender y No binario son la misma cuota", () => {
    expect(genderKey("Otro género")).toBe("non-binary");
    expect(genderKey("Other gender")).toBe("non-binary");
    expect(genderKey("No binario")).toBe("non-binary");
  });

  test("un género con cuota aparece en el formulario aunque el evento no lo liste", () => {
    expect(withQuotaGenders(["Hombre", "Mujer"], [{ gender: "Otro género" }], "es")).toEqual(["Hombre", "Mujer", "Otro género"]);
    expect(withQuotaGenders(["Man", "Woman"], [{ gender: "Otro género" }], "en")).toEqual(["Man", "Woman", "Other gender"]);
    expect(withQuotaGenders(["Hombre", "Mujer", "No binario"], [{ gender: "Otro género" }])).toHaveLength(3);
  });

  test("no cuenta ni como hombre ni como mujer en la paridad", () => {
    expect(parityGroup("Otro género")).toBe("other");
    expect(parityGroup("Woman")).toBe("woman");
    // Mesa de 5 con 1 plaza neutra: 2 hombres y 2 mujeres
    expect(parityTargetPerGender(5, 1)).toBe(2);
    expect(parityTargetPerGender(4, 0)).toBe(2);
  });

  test("se reparte: máximo 1 por mesa mientras haya mesas libres", () => {
    expect(otherSeatCap(2, 4)).toBe(1);
    expect(otherSeatCap(5, 4)).toBe(2);
    const table = { men: 1, women: 1, other: 1 };
    expect(allowsParitySeat("Otro género", table, 6, { men: 3, women: 3 }, 1)).toBe(false);
    expect(allowsParitySeat("Otro género", { men: 1, women: 1, other: 0 }, 6, { men: 3, women: 3 }, 1)).toBe(true);
  });

  test("con una plaza neutra, hombres y mujeres siguen equilibrados", () => {
    const table = { men: 2, women: 1, other: 1 };
    expect(allowsParitySeat("Hombre", table, 5, { men: 3, women: 3 })).toBe(false);
    expect(allowsParitySeat("Mujer", table, 5, { men: 3, women: 3 })).toBe(true);
    // Si no quedan mujeres, se permite otro hombre
    expect(allowsParitySeat("Hombre", { men: 2, women: 2, other: 0 }, 6, { men: 3, women: 0 })).toBe(true);
  });
});
