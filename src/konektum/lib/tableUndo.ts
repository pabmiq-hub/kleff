export interface TableRound {
  round: number;
  tables: { id: string; name: string; [key: string]: unknown }[][];
  [key: string]: unknown;
}

export interface TableUndoEntry {
  round: number;
  before: TableRound;
  after: TableRound;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function sameTableState(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}

/** Restore only the edited round, never overwrite later edits to other rounds. */
export function restoreTableRound(rounds: TableRound[], entry: TableUndoEntry): TableRound[] | null {
  const current = rounds.find(r => r.round === entry.round);
  if (!current || !sameTableState(current, entry.after)) return null;
  return rounds.map(r => r.round === entry.round ? structuredClone(entry.before) : r);
}

export function readTableUndo(eventId: string): Record<string, TableUndoEntry> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(`kon-table-undo:${eventId}`) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entry]) =>
      entry && typeof entry.round === "number" && entry.before && entry.after &&
      Array.isArray(entry.before.tables) && Array.isArray(entry.after.tables)
    ));
  } catch { return {}; }
}

export function writeTableUndo(eventId: string, entries: Record<string, TableUndoEntry>): void {
  try { sessionStorage.setItem(`kon-table-undo:${eventId}`, JSON.stringify(entries)); }
  catch { /* Undo remains available in memory if browser storage is unavailable. */ }
}