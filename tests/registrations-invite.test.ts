import { describe, expect, test } from "bun:test";
import { buildInviteAudience } from "../src/lib/registrations-invite";

const row = (email: string, created_at: string, cancelled = false, name = "X") => ({ email, name, created_at, cancelled });

describe("invite audience", () => {
  test("one email per person, latest name wins", () => {
    const a = buildInviteAudience([row("A@x.com", "2026-01-01", false, "Old"), row("a@x.com", "2026-05-01", false, "New")], { includeCancelled: false, alreadyRegistered: [] });
    expect(a.recipients).toEqual([{ email: "a@x.com", name: "New" }]);
  });
  test("skips people already registered in the target", () => {
    const a = buildInviteAudience([row("a@x.com", "2026-01-01"), row("b@x.com", "2026-01-01")], { includeCancelled: false, alreadyRegistered: ["B@x.com"] });
    expect(a.recipients.map((r) => r.email)).toEqual(["a@x.com"]);
    expect(a.skippedRegistered).toBe(1);
  });
  test("cancelled excluded by default, included when asked", () => {
    const rows = [row("c@x.com", "2026-01-01", true)];
    expect(buildInviteAudience(rows, { includeCancelled: false, alreadyRegistered: [] }).recipients).toHaveLength(0);
    expect(buildInviteAudience(rows, { includeCancelled: true, alreadyRegistered: [] }).recipients).toHaveLength(1);
  });
  test("cancelled once but active elsewhere is still invited", () => {
    const a = buildInviteAudience([row("d@x.com", "2026-05-01", true), row("d@x.com", "2026-01-01")], { includeCancelled: false, alreadyRegistered: [] });
    expect(a.recipients).toHaveLength(1);
  });
});
