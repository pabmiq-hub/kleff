import { describe, expect, it } from "vitest";
import { correctedRoundState, lastRemovableRound, removePendingRound, pendingRoundDeletion } from "./roundControl";

const rounds = [1, 2, 3, 4].map(round => ({ round, tables: [[`seat-${round}`]] }));

describe("Konektum round controls", () => {
  it("only offers round 4 when round 3 is current", () => {
    expect(lastRemovableRound(rounds, 3, [1, 2], "active")).toBe(4);
  });
  it("cannot delete completed round 2", () => {
    expect(removePendingRound(rounds, 2, 3, [1, 2], "active")).toBeNull();
  });
  it("cannot delete the current round 3, even before its timer starts", () => {
    expect(removePendingRound(rounds, 3, 3, [1, 2], "active")).toBeNull();
  });
  it("does not renumber or modify played seating when deleting round 4", () => {
    expect(removePendingRound(rounds, 4, 3, [1, 2], "active")).toEqual(rounds.slice(0, 3));
  });
  it("cannot delete a completed final round or rounds in a closed event", () => {
    expect(lastRemovableRound(rounds, 3, [1, 2, 4], "active")).toBeNull();
    expect(lastRemovableRound(rounds, 3, [1, 2], "completed")).toBeNull();
  });
  it("cannot remove an intermediate pending round", () => {
    expect(removePendingRound(rounds, 3, 2, [1], "active")).toBeNull();
  });
  it("keeps round 3 active and its paused timer at 125 seconds after removing round 4", () => {
    const state = { tables: rounds, current_round: 3, completed_rounds: [1, 2], rounds: 4,
      draft_round: 4, status: "active", round_started_at: "2026-11-28T06:00:00Z",
      round_paused_at: "2026-11-28T06:02:05Z", round_elapsed_seconds: 125 };
    const patch = pendingRoundDeletion(state, 4);
    expect(patch).toEqual({ tables: rounds.slice(0, 3), rounds: 3, draft_round: null });
    expect({ ...state, ...patch }).toMatchObject({ current_round: 3, completed_rounds: [1, 2],
      round_started_at: "2026-11-28T06:00:00Z", round_paused_at: "2026-11-28T06:02:05Z", round_elapsed_seconds: 125 });
  });
  it("explicit correction to round 2 resets the timer and reopens rounds 2 onward", () => {
    expect(correctedRoundState(rounds, 2, [1, 2, 3])).toEqual({
      current_round: 2, completed_rounds: [1], round_started_at: null,
      round_paused_at: null, round_elapsed_seconds: 0,
    });
  });
  it("rejects correction to a nonexistent round", () => {
    expect(correctedRoundState(rounds, 5, [1, 2])).toBeNull();
  });
});