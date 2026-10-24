import { describe, expect, test } from "bun:test";
import { ageRangeForBirthDate, countQuotaParticipants, effectivePreferredAgeRange, genderKey, matchingQuota, profileAgeRange, synchronizeQuotas, uniqueGenderLabels } from "../src/konektum/lib/registration-quotas";
import { registrationAgeFields, registrationAgeValues } from "../src/konektum/lib/registration-form-config";

const today = new Date("2026-10-24T12:00:00Z");
const ranges = ["18+"];
const women = { gender: "Mujer", ageRange: "18+", maxSlots: 30 };

describe("current Konektum bands and translated genders", () => {
  test("Mujer and Woman share a gender in both directions", () => {
    expect(genderKey("Mujer")).toBe(genderKey("Woman"));
    expect(matchingQuota([women], { gender: "Woman", birth_date: "1990-04-01" }, ranges, today)).toEqual(women);
    expect(matchingQuota([{ ...women, gender: "Woman" }], { gender: "Mujer", birth_date: "1990-04-01" }, ranges, today)?.maxSlots).toBe(30);
  });
  test("Hombre and Man do not produce separate filter categories", () => {
    expect(uniqueGenderLabels(["Hombre", "Man", "Woman", "Mujer"])).toEqual(["Hombre", "Mujer"]);
  });
  test("organizer-defined genders are not merged into built-in ones", () => {
    expect(genderKey("Mi colectivo")).not.toBe(genderKey("Mujer"));
    expect(uniqueGenderLabels(["Mi colectivo"])).toEqual(["Mi colectivo"]);
  });
  test("one 18+ band reclassifies previous 33-40 and 41+ participants", () => {
    expect(profileAgeRange({ birth_date: "1990-02-01", age_range: "33-40" }, ranges, today)).toBe("18+");
    expect(profileAgeRange({ birth_date: "1975-02-01", age_range: "41+" }, ranges, today)).toBe("18+");
  });
  test("one band does not force an ineligible minor into 18+", () => {
    expect(ageRangeForBirthDate("2010-10-24", ranges, today)).toBe("Otro");
    expect(matchingQuota([women], { gender: "Woman", birth_date: "2010-10-24" }, ranges, today)).toBeUndefined();
  });
  test("exact birthday meets the band minimum", () => {
    expect(ageRangeForBirthDate("2008-10-24", ranges, today)).toBe("18+");
    expect(ageRangeForBirthDate("2008-10-25", ranges, today)).toBe("Otro");
  });
  test("older band without birth date maps only if wholly inside current band", () => {
    expect(profileAgeRange({ age_range: "33-40" }, ranges, today)).toBe("18+");
    expect(profileAgeRange({ age_range: "15-20" }, ranges, today)).toBe("15-20");
  });
  test("both languages consume seats and exclude cancelled/fake profiles", () => {
    expect(countQuotaParticipants([
      { gender: "Mujer", birth_date: "1990-01-01" },
      { gender: "Woman", birth_date: "1980-01-01", age_range: "41+" },
      { gender: "Woman", birth_date: "1980-01-01", cancelled_at: "2026-10-20" },
      { gender: "Woman", birth_date: "1980-01-01", is_fake: true },
      { gender: "Man", birth_date: "1980-01-01" },
    ], women, ranges, today)).toBe(2);
  });
  test("one available seat becomes full with a translated historic profile", () => {
    const people = Array.from({ length: 29 }, () => ({ gender: "Mujer", age_range: "18+" }));
    expect(women.maxSlots - countQuotaParticipants(people, women, ranges, today)).toBe(1);
    expect(countQuotaParticipants([...people, { gender: "Woman", age_range: "41+" }], women, ranges, today)).toBe(30);
  });
  test("collapsing bands retains distinct old capacities without translated duplication", () => {
    const quotas = [
      { gender: "Mujer", ageRange: "18-24", maxSlots: 10 },
      { gender: "Woman", ageRange: "18–24", maxSlots: 10 },
      { gender: "Mujer", ageRange: "25-32", maxSlots: 20 },
    ];
    expect(synchronizeQuotas(quotas, ranges)).toEqual([women]);
    expect(synchronizeQuotas(synchronizeQuotas(quotas, ranges), ranges)).toEqual([women]);
  });
  test("multiple bands keep their distinct capacities and age assignment", () => {
    const quotas = [{ ...women, ageRange: "25-32" }, { ...women, ageRange: "33-40" }];
    expect(synchronizeQuotas(quotas, ["25-32", "33-40"])).toEqual(quotas);
    expect(profileAgeRange({ birth_date: "1990-01-01" }, ["25-32", "33-40"], today)).toBe("33-40");
  });
  test("hidden preference derives from single band rather than stale answers", () => {
    expect(effectivePreferredAgeRange("33-40, 41+", ranges)).toBe("18+");
    expect(registrationAgeValues({ preferred_age_range: ["33-40"] }, ranges)).toEqual({ preferred_age_range: "18+" });
  });
  test("single band removes redundant required built-in preference but keeps custom question", () => {
    const fields = [
      { id: "preferred_age_range", type: "multiselect" as const, label: "Edad", required: true, system: true, options: ["33-40"] },
      { id: "custom_age", type: "select" as const, label: "Grupo", required: true, options: ["A", "B"] },
    ];
    expect(registrationAgeFields(fields, ranges)).toEqual([fields[1]]);
    expect(registrationAgeFields(fields, ["25-32", "33-40"])[0]?.options).toEqual(["25-32", "33-40"]);
  });
  test("single actual-age question is derived automatically when birth date is present", () => {
    const fields = [
      { id: "birth_date", type: "date" as const, label: "Nacimiento", required: true, system: true },
      { id: "age_range", type: "select" as const, label: "Edad", required: true, system: true, options: ["33-40"] },
    ];
    expect(registrationAgeFields(fields, ranges)).toEqual([fields[0]]);
    expect(registrationAgeValues({ birth_date: "1990-01-01", age_range: "33-40" }, ranges).age_range).toBe("18+");
  });
});