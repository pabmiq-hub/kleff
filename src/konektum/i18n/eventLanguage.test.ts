// @ts-nocheck
import { describe, it, expect } from "vitest";
import { resolveEventLang } from "./eventLanguage";

describe("resolveEventLang", () => {
  it("usa el idioma del evento si el admin no habilita el selector", () => {
    expect(resolveEventLang("es", false, "en")).toBe("es");
  });
  it("usa la elección del participante si el selector está habilitado", () => {
    expect(resolveEventLang("es", true, "en")).toBe("en");
  });
  it("sin elección guardada, cae al idioma del evento", () => {
    expect(resolveEventLang("en", true, null)).toBe("en");
  });
});
