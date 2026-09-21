// @ts-nocheck
// Custom table layout helpers (Enterprise feature).
// When enabled, replaces the uniform table_size with explicit per-table capacities.

export type CustomTableFill = "balanced" | "sequential";

export interface CustomTableLayout {
  enabled: boolean;
  tables: { capacity: number }[];
  /**
   * "balanced" (default): always create every configured table and spread the
   * attendees across all of them, never exceeding each table's capacity.
   * "sequential": fill table 1 up to its capacity, then table 2, and so on.
   */
  fill?: CustomTableFill;
}

export const isCustomTablesEnabled = (
  cfg: CustomTableLayout | null | undefined
): cfg is CustomTableLayout => {
  return !!cfg && cfg.enabled === true && Array.isArray(cfg.tables) && cfg.tables.length > 0;
};

export const getCustomTableFill = (
  cfg: CustomTableLayout | null | undefined
): CustomTableFill => (cfg?.fill === "sequential" ? "sequential" : "balanced");

/**
 * Compute a distribution that respects the configured per-table capacities.
 *
 * - "sequential": fills tables in their configured order; only the last active
 *   table may be incomplete, and later tables stay closed.
 * - "balanced" (default): opens every configured table and spreads attendees
 *   proportionally to each capacity, never exceeding it.
 *
 * In both modes, if attendance exceeds the total configured capacity, extra
 * overflow tables are opened using the last configured capacity.
 */
export const computeCustomDistribution = (
  numParticipants: number,
  capacities: number[],
  fill: CustomTableFill = "balanced"
): { numTables: number; sizes: number[] } => {
  const caps = capacities.map(c => Math.max(0, Math.floor(Number(c) || 0))).filter(c => c > 0);
  if (caps.length === 0 || numParticipants <= 0) {
    return { numTables: 0, sizes: [] };
  }

  const totalCapacity = caps.reduce((a, b) => a + b, 0);
  const seated = Math.min(numParticipants, totalCapacity);
  let sizes: number[] = [];

  if (fill === "sequential") {
    let remaining = seated;
    for (const capacity of caps) {
      if (remaining <= 0) break;
      const size = Math.min(capacity, remaining);
      sizes.push(size);
      remaining -= size;
    }
  } else {
    // Proportional allocation across every configured table.
    const exact = caps.map(c => (seated * c) / totalCapacity);
    sizes = exact.map(v => Math.floor(v));
    let left = seated - sizes.reduce((a, b) => a + b, 0);
    const order = exact
      .map((v, i) => ({ i, frac: v - Math.floor(v) }))
      .sort((a, b) => b.frac - a.frac || a.i - b.i);
    let idx = 0;
    while (left > 0 && order.length > 0) {
      const target = order[idx % order.length].i;
      if (sizes[target] < caps[target]) {
        sizes[target] += 1;
        left -= 1;
      }
      idx += 1;
      if (idx > order.length * 40) break;
    }
    // Never leave a configured table with a single person: pull from the
    // fullest table when possible, otherwise close the lonely table.
    for (let i = sizes.length - 1; i >= 0 && seated >= 2; i--) {
      if (sizes[i] !== 1) continue;
      let donor = -1;
      for (let j = 0; j < sizes.length; j++) {
        if (j !== i && sizes[j] >= 3 && (donor === -1 || sizes[j] > sizes[donor])) donor = j;
      }
      if (donor !== -1) {
        sizes[donor] -= 1;
        sizes[i] += 1;
      }
    }
  }

  // Overflow beyond the configured capacity.
  let remaining = numParticipants - sizes.reduce((a, b) => a + b, 0);
  const overflowCapacity = caps[caps.length - 1];
  while (remaining > 0) {
    const size = Math.min(overflowCapacity, remaining);
    sizes.push(size);
    remaining -= size;
  }

  // Drop trailing empty tables (can only happen with very low attendance).
  while (sizes.length > 0 && sizes[sizes.length - 1] === 0) sizes.pop();

  return { numTables: sizes.length, sizes };
};
