// @ts-nocheck
// Custom table layout helpers (Enterprise feature).
// When enabled, replaces the uniform table_size with explicit per-table capacities.

export interface CustomTableLayout {
  enabled: boolean;
  tables: { capacity: number }[];
}

export const isCustomTablesEnabled = (
  cfg: CustomTableLayout | null | undefined
): cfg is CustomTableLayout => {
  return !!cfg && cfg.enabled === true && Array.isArray(cfg.tables) && cfg.tables.length > 0;
};

/**
 * Compute a distribution that respects the configured per-table capacities,
 * filling tables in their configured order. Every table reaches its configured
 * capacity before the next one opens; only the final active table may be smaller.
 */
export const computeCustomDistribution = (
  numParticipants: number,
  capacities: number[]
): { numTables: number; sizes: number[] } => {
  const caps = capacities.map(c => Math.max(0, Math.floor(Number(c) || 0))).filter(c => c > 0);
  if (caps.length === 0 || numParticipants <= 0) {
    return { numTables: 0, sizes: [] };
  }

  const sizes: number[] = [];
  let remaining = numParticipants;

  for (const capacity of caps) {
    if (remaining <= 0) break;
    const size = Math.min(capacity, remaining);
    sizes.push(size);
    remaining -= size;
  }

  // A custom layout is a capacity ceiling. If attendance exceeds it, keep
  // everybody assigned by opening overflow tables using the final capacity.
  const overflowCapacity = caps[caps.length - 1];
  while (remaining > 0) {
    const size = Math.min(overflowCapacity, remaining);
    sizes.push(size);
    remaining -= size;
  }

  return { numTables: sizes.length, sizes };
};
