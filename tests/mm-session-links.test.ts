import { describe, expect, test } from "bun:test";
import { normalizeSessionSlug, sessionJoinPath, sessionSlugSchema } from "../src/lib/mm/session-links";
import { resolveSessionSlug, updateSessionSlug } from "../src/lib/mm/session-links.server";
const sessionId = "00000000-0000-4000-8000-000000000001";
function mockDb(result: any) {
  const calls: any[] = [];
  const chain: any = {};
  for (const method of ["from", "select", "update", "eq"]) chain[method] = (...args: any[]) => { calls.push([method, ...args]); return chain; };
  chain.maybeSingle = async () => result;
  return { db: () => chain, calls };
}
describe("short session links", () => {
  test("custom names are normalized to lowercase without accents", () => {
    expect(normalizeSessionSlug("  Drácula Viernes  ")).toBe("dracula-viernes");
    expect(sessionSlugSchema.parse("  Drácula Viernes  ")).toBe("dracula-viernes");
  });
  test("rejects empty and malformed names, paths and punctuation", () => {
    for (const slug of ["", "ab", "-dracula", "dracula-", "dracula--viernes", "j/dracula", "https://kleff.es/j/test", "<script>", "a".repeat(49)]) expect(sessionSlugSchema.safeParse(slug).success).toBe(false);
  });
  test("creates the short join link with the chosen name", () => {
    expect(sessionJoinPath(sessionId, "dracula-viernes")).toBe("/j/dracula-viernes");
  });
  test("preserves the original UUID join path", () => {
    expect(sessionJoinPath(sessionId)).toBe(`/actividades/juegos/unirse/${sessionId}`);
  });
  test("public resolution projects only the session ID", async () => {
    const { db, calls } = mockDb({ data: { id: sessionId }, error: null });
    expect(await resolveSessionSlug(db, "Drácula Viernes")).toBe(sessionId);
    expect(calls).toEqual([["from", "mm_sessions"], ["select", "id"], ["eq", "join_slug", "dracula-viernes"]]);
  });
  test("unknown and invalid names return no session", async () => {
    const { db, calls } = mockDb({ data: null, error: null });
    expect(await resolveSessionSlug(db, "missing-game")).toBeNull();
    const before = calls.length;
    expect(await resolveSessionSlug(db, "../admin")).toBeNull();
    expect(calls.length).toBe(before);
  });
  test("editing writes only the chosen session slug", async () => {
    const { db, calls } = mockDb({ data: { id: sessionId, join_slug: "dracula-viernes" }, error: null });
    expect(await updateSessionSlug(db, { sessionId, slug: "Drácula Viernes" })).toEqual({ slug: "dracula-viernes" });
    expect(calls).toContainEqual(["update", { join_slug: "dracula-viernes" }]);
    expect(calls).toContainEqual(["eq", "id", sessionId]);
  });
  test("duplicate names are rejected rather than moving another session", async () => {
    const { db } = mockDb({ data: null, error: { code: "23505" } });
    await expect(updateSessionSlug(db, { sessionId, slug: "already-used" })).rejects.toThrow("otra partida");
  });
});