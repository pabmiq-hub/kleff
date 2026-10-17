import { test, expect, mock } from 'bun:test';

let session: Record<string, any>;
let events: Array<{ type: string }>;
const acts = [
  { id: 'a1', position: 1, key: 'intro', name: 'Cena', duration_minutes: 15 },
  { id: 'a2', position: 2, key: 'custom-crime', name: 'Crimen', duration_minutes: 30 },
  { id: 'a3', position: 3, key: 'conclusion', name: 'Acusación', duration_minutes: 15 },
];

mock.module('../src/integrations/supabase/client.server', () => ({
  supabaseAdmin: {
    from(table: string) {
      let patch: Record<string, unknown> | undefined;
      const filters: Array<[string, unknown]> = [];
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters.push([key, value]); return query; },
        is(key: string, value: unknown) { filters.push([key, value]); return query; },
        order() { return query; },
        single() { return Promise.resolve({ data: { ...session } }); },
        update(value: Record<string, unknown>) { patch = value; return query; },
        insert(value: { type: string }) { events.push(value); return Promise.resolve({ error: null }); },
        then(resolve: (result: { data: unknown; error: null }) => unknown) {
          if (table === 'mm_acts') return Promise.resolve(resolve({ data: acts, error: null }));
          const matches = filters.every(([key, value]) => (session[key] ?? null) === value);
          if (patch && matches) Object.assign(session, patch);
          return Promise.resolve(resolve({ data: matches ? [{ id: session.id }] : [], error: null }));
        },
      };
      return query;
    },
  },
}));

const { advanceAct } = await import('../src/lib/mm/engine.server');
// Realtime is exercised without sending anything to the live backend.
mock.module('../src/lib/mm/translate.server', () => ({}));
const originalFetch = globalThis.fetch;
globalThis.fetch = mock(async () => new Response('{}')) as unknown as typeof fetch;

for (const mode of ['manual', 'timer', 'auto']) {
  test(`act two triggers murder atomically in ${mode} mode, including custom act keys`, async () => {
    session = { id: 's', game_id: 'g', status: 'running', current_act_id: 'a1', control_mode: mode, murder_triggered_at: null };
    events = [];
    await advanceAct('s', 'a1', mode === 'manual' ? 'admin' : 'timer');
    expect(session.current_act_id).toBe('a2');
    expect(typeof session.murder_triggered_at).toBe('string');
    expect(events.filter(e => e.type === 'murder_triggered')).toHaveLength(1);
    await advanceAct('s', 'a1', 'admin');
    await advanceAct('s', 'a2', 'admin');
    expect(session.current_act_id).toBe('a3');
    expect(events.filter(e => e.type === 'murder_triggered')).toHaveLength(1);
  });
}

test('a murder launched early is preserved when entering act two while paused', async () => {
  session = { id: 's', game_id: 'g', status: 'paused', current_act_id: 'a1', control_mode: 'manual', murder_triggered_at: '2026-10-17T17:47:00Z' };
  events = [];
  await advanceAct('s', 'a1', 'admin');
  expect(session.current_act_id).toBe('a2');
  expect(session.murder_triggered_at).toBe('2026-10-17T17:47:00Z');
  expect(session.act_ends_at).toBeNull();
  expect(events.filter(e => e.type === 'murder_triggered')).toHaveLength(0);
});