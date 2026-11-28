interface NumberedRound { round: number }

/** Only the last future round can be discarded; played round IDs stay stable. */
export function lastRemovableRound(rounds: NumberedRound[], currentRound: number, completed: number[], status: string): number | null {
  if (status !== "active" || rounds.length <= 1) return null;
  const last = Math.max(...rounds.map(r => r.round));
  return last > currentRound && !completed.includes(last) ? last : null;
}

export function removePendingRound<T extends NumberedRound>(rounds: T[], target: number, currentRound: number, completed: number[], status: string): T[] | null {
  if (lastRemovableRound(rounds, currentRound, completed, status) !== target) return null;
  return rounds.filter(r => r.round !== target);
}

export function pendingRoundDeletion<T extends NumberedRound>(state: {
  tables: T[]; current_round: number | null; completed_rounds: number[] | null;
  rounds: number; draft_round: number | null; status: string;
}, target: number) {
  const current = state.current_round || 1;
  const remaining = removePendingRound(state.tables, target, current, state.completed_rounds || [], state.status);
  if (!remaining) return null;
  // Intentionally omit active/completed round and all timer fields from writes.
  return {
    tables: remaining,
    rounds: Math.max(current, (state.rounds || state.tables.length) - 1, ...remaining.map(r => r.round)),
    draft_round: state.draft_round === target ? null : state.draft_round,
  };
}

/** Explicit emergency correction reopens the selected and subsequent rounds. */
export function correctedRoundState(rounds: NumberedRound[], target: number, completed: number[]) {
  if (!rounds.some(r => r.round === target)) return null;
  return {
    current_round: target,
    completed_rounds: completed.filter(r => r < target),
    round_started_at: null,
    round_paused_at: null,
    round_elapsed_seconds: 0,
  };
}