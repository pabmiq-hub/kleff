import { describe, expect, it } from "vitest";
import {
  HITSTER_CATEGORIES,
  HITSTER_COLORS,
  emptyMarks,
  evaluateGameOutcome,
  generateBoard,
  getRoundValidationProgress,
  hasBingoLine,
  hasSubmittedAnswer,
} from "./hitster";

describe("hitster board & rules", () => {
  it("generates a 5x5 board with exactly 5 cells of each color", () => {
    const board = generateBoard();
    expect(board).toHaveLength(25);
    for (const c of HITSTER_COLORS) {
      expect(board.filter((x) => x === c)).toHaveLength(5);
    }
  });

  it("detects complete rows and columns but not diagonals", () => {
    const row = emptyMarks();
    for (let i = 10; i < 15; i++) row[i] = true;
    expect(hasBingoLine(row)).toEqual([10, 11, 12, 13, 14]);

    const col = emptyMarks();
    for (let r = 0; r < 5; r++) col[r * 5 + 3] = true;
    expect(hasBingoLine(col)).toEqual([3, 8, 13, 18, 23]);

    const diag = emptyMarks();
    for (let i = 0; i < 5; i++) diag[i * 6] = true;
    expect(hasBingoLine(diag)).toBeNull();
  });

  it("grants exact-year rival punishment only on Side A yellow (±4) and blue (±2)", () => {
    expect(HITSTER_CATEGORIES.A.yellow.allowExactBonus).toBe(true);
    expect(HITSTER_CATEGORIES.A.blue.allowExactBonus).toBe(true);
    expect(HITSTER_CATEGORIES.A.green.allowExactBonus).toBe(false);
    expect(HITSTER_CATEGORIES.A.pink.allowExactBonus).toBe(false);
    expect(HITSTER_CATEGORIES.A.purple.allowExactBonus).toBe(false);
    for (const c of HITSTER_COLORS) {
      expect(HITSTER_CATEGORIES.B[c].allowExactBonus).toBe(false);
    }
  });

  it("declares single winner on line completion and starts tiebreak on simultaneous lines", () => {
    const fullRow = emptyMarks();
    for (let i = 0; i < 5; i++) fullRow[i] = true;
    const empty = emptyMarks();

    const single = evaluateGameOutcome({
      status: "playing",
      participants: [
        { id: "p1", marks: fullRow },
        { id: "p2", marks: empty },
      ],
      tiebreakIds: [],
      roundCorrectIds: ["p1"],
    });
    expect(single).toEqual({ status: "finished", winnerIds: ["p1"], tiebreakIds: [] });

    const tied = evaluateGameOutcome({
      status: "playing",
      participants: [
        { id: "p1", marks: fullRow },
        { id: "p2", marks: fullRow },
      ],
      tiebreakIds: [],
      roundCorrectIds: ["p1", "p2"],
    });
    expect(tied).toEqual({ status: "tiebreak", winnerIds: [], tiebreakIds: ["p1", "p2"] });
  });

  it("resolves tiebreak when one tied player pulls ahead with a correct answer", () => {
    const stillTied = evaluateGameOutcome({
      status: "tiebreak",
      participants: [],
      tiebreakIds: ["p1", "p2"],
      roundCorrectIds: ["p1", "p2"],
    });
    expect(stillTied).toEqual({ status: "tiebreak", winnerIds: [], tiebreakIds: ["p1", "p2"] });

    const winner = evaluateGameOutcome({
      status: "tiebreak",
      participants: [],
      tiebreakIds: ["p1", "p2"],
      roundCorrectIds: ["p2", "p3"],
    });
    expect(winner).toEqual({ status: "finished", winnerIds: ["p2"], tiebreakIds: [] });
  });

  it("only treats non-empty trimmed answers as submitted", () => {
    expect(hasSubmittedAnswer(null)).toBe(false);
    expect(hasSubmittedAnswer({ answer_text: "" })).toBe(false);
    expect(hasSubmittedAnswer({ answer_text: "   " })).toBe(false);
    expect(hasSubmittedAnswer({ answer_text: "1994" })).toBe(true);
  });

  it("marks round validation as allDone when every participant who answered has validated", () => {
    const pending = getRoundValidationProgress({
      status: "playing",
      participants: [
        { id: "p1", answer: { answer_text: "Grupo", is_correct: true } },
        { id: "p2", answer: { answer_text: "Solista", is_correct: null } },
        { id: "p3", answer: null },
      ],
    });
    expect(pending).toEqual({ submitted: 2, validated: 1, allDone: false });

    const done = getRoundValidationProgress({
      status: "playing",
      participants: [
        { id: "p1", answer: { answer_text: "Grupo", is_correct: true } },
        { id: "p2", answer: { answer_text: "Solista", is_correct: false } },
        { id: "p3", answer: null },
      ],
    });
    expect(done).toEqual({ submitted: 2, validated: 2, allDone: true });
  });
});