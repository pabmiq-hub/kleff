import { describe, expect, test } from "bun:test";
import { thanksSendAt } from "../src/lib/registrations-thanks";

describe("thanksSendAt", () => {
  test("event Sun 18 Oct 2026 18:00 Madrid → Mon 19 Oct 12:00 Madrid (10:00 UTC)", () => {
    expect(thanksSendAt(new Date("2026-10-18T16:00:00Z")).toISOString()).toBe("2026-10-19T10:00:00.000Z");
  });
  test("winter time: event 20 Nov 2026 → 21 Nov 12:00 Madrid (11:00 UTC)", () => {
    expect(thanksSendAt(new Date("2026-11-20T19:00:00Z")).toISOString()).toBe("2026-11-21T11:00:00.000Z");
  });
  test("late-night event after UTC midnight uses Madrid calendar day", () => {
    // 23 Oct 00:30 Madrid = 22 Oct 22:30 UTC → 24 Oct 12:00 Madrid
    expect(thanksSendAt(new Date("2026-10-22T22:30:00Z")).toISOString()).toBe("2026-10-24T10:00:00.000Z");
  });
});
