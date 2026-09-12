// @ts-nocheck
/**
 * Seats a participant in an ONGOING preliminary round without ever resetting it.
 * Only appends to the existing tables; never clears tables, started_at,
 * confirmations or dismissed_tables.
 */
export async function seatInPreliminaryRound(
  supabase: any,
  eventId: string,
  participant: { id: string; name: string }
): Promise<void> {
  try {
    const { data: eventConfig } = await supabase
      .from('events')
      .select('preliminary_round, table_size, module, game_mode, custom_tables')
      .eq('id', eventId)
      .maybeSingle();

    const prelim = (eventConfig as any)?.preliminary_round;
    const isSocial = !(eventConfig as any)?.module || (eventConfig as any).module === 'social';
    if (!isSocial || !prelim?.enabled) return;
    // Preliminary round already closed → nothing to do.
    if (prelim.closed_at) return;

    const tableSize = (eventConfig as any)?.table_size || 4;
    const tables: any[][] = Array.isArray(prelim.tables) ? prelim.tables.map((t: any[]) => [...t]) : [];
    const dismissed: number[] = Array.isArray(prelim.dismissed_tables) ? prelim.dismissed_tables : [];

    const customCfg = (eventConfig as any)?.custom_tables;
    const capacities: number[] | null =
      customCfg && customCfg.enabled && Array.isArray(customCfg.tables) && customCfg.tables.length > 0
        ? customCfg.tables.map((t: any) => Math.max(0, Math.floor(Number(t?.capacity) || 0)))
        : null;
    const hasCustomCaps = Array.isArray(capacities) && capacities.length > 0;
    const capacityFor = (idx: number): number => {
      if (hasCustomCaps && idx < (capacities as number[]).length) {
        const c = (capacities as number[])[idx];
        return c > 0 ? c : tableSize;
      }
      return tableSize;
    };
    if (hasCustomCaps) {
      while (tables.length < (capacities as number[]).length) tables.push([]);
    }

    if (tables.some((t) => Array.isArray(t) && t.some((p: any) => p?.id === participant.id))) return;

    // Modo Lúdico
    const rawGM = (eventConfig as any)?.game_mode;
    const gmEnabled = !!(rawGM && rawGM.enabled);
    const dynamics: Array<{ id: string; table_numbers: number[] }> =
      gmEnabled && Array.isArray(rawGM.dynamics) ? rawGM.dynamics : [];
    const dynForTable = (n: number): string | null => {
      if (!gmEnabled) return null;
      for (const d of dynamics) {
        if (Array.isArray(d.table_numbers) && d.table_numbers.includes(n)) return d.id;
      }
      return null;
    };
    const played: Record<string, string[]> = {};
    if (gmEnabled) {
      tables.forEach((seats, idx) => {
        if (!Array.isArray(seats)) return;
        const dynId = dynForTable(idx + 1);
        if (!dynId) return;
        for (const p of seats) {
          if (!p?.id) continue;
          const list = played[p.id] || (played[p.id] = []);
          if (!list.includes(dynId)) list.push(dynId);
        }
      });
    }

    const candidates = tables
      .map((t, i) => ({ i, free: capacityFor(i) - (Array.isArray(t) ? t.length : 0) }))
      .filter(({ i, free }) => !dismissed.includes(i) && free > 0)
      .sort((a, b) => b.free - a.free || a.i - b.i);

    let placed = false;
    for (const { i } of candidates) {
      const dynId = dynForTable(i + 1);
      if (dynId && (played[participant.id] || []).includes(dynId)) continue;
      tables[i].push({ id: participant.id, name: participant.name });
      if (dynId) played[participant.id] = [...(played[participant.id] || []), dynId];
      placed = true;
      break;
    }
    if (!placed) {
      tables.push([{ id: participant.id, name: participant.name }]);
      const dynId = dynForTable(tables.length);
      if (dynId) played[participant.id] = [...(played[participant.id] || []), dynId];
    }

    const updates: any = {
      preliminary_round: { ...prelim, tables, started_at: prelim.started_at || new Date().toISOString() },
    };
    if (gmEnabled) updates.game_mode = { ...rawGM, played };

    await supabase.from('events').update(updates).eq('id', eventId);
  } catch (e) {
    console.error('[preliminarySeat] error', e);
  }
}
