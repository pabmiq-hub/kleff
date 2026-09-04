// @ts-nocheck
// Ported from the original Konektum shared helpers.
/** Rounds (incl. preliminary round 0) where the participant is seated, with tablemate ids. */
export function resolveParticipantRounds(event: any, participantId: string) {
  const result: { round: number; table: number; tablemateIds: string[] }[] = [];
  const tables = Array.isArray(event.tables) ? event.tables : [];
  const completedRounds: number[] = event.completed_rounds || [];
  const maxTableRound = tables.reduce((max: number, r: any) => Math.max(max, Number(r?.round) || 0), 0);
  const maxCompleted = completedRounds.reduce((m: number, r: any) => Math.max(m, Number(r) || 0), 0);
  const storedCurrent = event.current_round || 0;
  const isCompleted = event.status === "completed";
  const currentRound = isCompleted
    ? Math.max(storedCurrent, maxTableRound)
    : Math.min(
        Math.max(event.rounds || maxTableRound || 0, maxTableRound),
        Math.max(storedCurrent, maxCompleted > 0 ? maxCompleted + 1 : 0),
      );
  const draftRound = event.draft_round ?? null;

  for (const roundData of tables) {
    const roundNumber = Number(roundData?.round) || 0;
    if (!isCompleted && roundNumber > currentRound) continue;
    if (draftRound !== null && roundNumber === draftRound) continue;
    const roundTables = roundData?.tables;
    if (!Array.isArray(roundTables)) continue;
    for (let i = 0; i < roundTables.length; i++) {
      const table = roundTables[i];
      if (!Array.isArray(table)) continue;
      if (table.some((p: any) => p?.id === participantId)) {
        result.push({
          round: roundNumber,
          table: i + 1,
          tablemateIds: table.filter((p: any) => p?.id !== participantId).map((p: any) => p.id),
        });
        break;
      }
    }
  }

  const prelim = event.preliminary_round;
  if (prelim?.enabled && Array.isArray(prelim.tables)) {
    const dismissed: number[] = prelim.dismissed_tables || [];
    const confirmations: Record<string, boolean> = prelim.confirmations || {};
    if (confirmations[participantId] !== false) {
      for (let i = 0; i < prelim.tables.length; i++) {
        if (dismissed.includes(i)) continue;
        const table = prelim.tables[i];
        if (!Array.isArray(table)) continue;
        if (table.some((p: any) => p?.id === participantId)) {
          result.push({
            round: 0,
            table: i + 1,
            tablemateIds: table.filter((p: any) => p?.id !== participantId).map((p: any) => p.id),
          });
          break;
        }
      }
    }
  }

  return { rounds: result.sort((a, b) => a.round - b.round), currentRound };
}
