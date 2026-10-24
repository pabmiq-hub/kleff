import { describe, expect, test } from "bun:test";
import { registrationFieldLabel, registrationOptionLabel, registrationPlaceholder } from "@/konektum/lib/registration-field-labels";

describe("registration labels do not rewrite canonical option values", () => {
  test("English display leaves the saved Spanish gender value intact", () => {
    const field = { id: "gender", system: true, options: ["Hombre", "Mujer"] };
    expect(field.options.map(value => ({ value, label: registrationOptionLabel(field, value, "en") })))
      .toEqual([{ value: "Hombre", label: "Man" }, { value: "Mujer", label: "Woman" }]);
  });

  test("connection and dating values stay usable by matching", () => {
    const connection = { id: "preference", system: true };
    expect(registrationOptionLabel(connection, "Amistad y ligue", "en")).toBe("Friendship & dating");
    expect(registrationOptionLabel(connection, "Solo amistad", "en")).toBe("Friendship only");
    const dating = { id: "dating_preference", system: true };
    expect(registrationOptionLabel(dating, "Soy una mujer y busco un hombre", "en")).toBe("I'm a woman looking for a man");
  });

  test("unknown organizer options and non-system fields are untouched", () => {
    expect(registrationOptionLabel({ id: "gender", system: true }, "Personalizado", "en")).toBe("Personalizado");
    expect(registrationOptionLabel({ id: "gender", system: false }, "Mujer", "en")).toBe("Mujer");
    expect(registrationFieldLabel({ id: "name", system: true }, "Nombre artístico", "en")).toBe("Nombre artístico");
  });

  test("Spanish remains unchanged", () => {
    const field = { id: "gender", system: true };
    expect(registrationOptionLabel(field, "Mujer", "es")).toBe("Mujer");
    expect(registrationPlaceholder(field, "Seleccionar...", "es")).toBe("Seleccionar...");
  });
});