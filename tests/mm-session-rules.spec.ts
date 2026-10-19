import { test, expect } from '@playwright/test';
import { isSessionLanguageLocked, sessionEligibility, planCharacterAssignments, shouldTriggerMurder } from '../src/lib/mm/session-rules';

const game = { min_players: 4, max_players: 8 };
const chars = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, is_killer: i === 0, victim: false }));
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, character_id: null as string | null }));

test('murder belongs to act two and not acts one or three', () => {
  expect(shouldTriggerMurder({ position: 1 }, {})).toBe(false);
  expect(shouldTriggerMurder({ position: 2 }, {})).toBe(true);
  expect(shouldTriggerMurder({ position: 3 }, {})).toBe(false);
});
test('entering act two cannot repeat a murder already launched', () => {
  expect(shouldTriggerMurder({ position: 2 }, { murder_triggered_at: '2026-10-17T17:47:00Z' })).toBe(false);
});

test('minimum four blocks three players and reports one missing', () => {
  const result = sessionEligibility(game, chars, players(3));
  expect(result.missing).toBe(1);
  expect(result.allowed).toBe(false);
  expect(sessionEligibility(game, chars, players(4)).allowed).toBe(true);
});
test('maximum eight blocks nine players', () => {
  expect(sessionEligibility(game, chars, players(9)).allowed).toBe(false);
});
test('victims cannot receive player assignments', () => {
  expect(sessionEligibility(game, [...chars, { id: 'victim', victim: true, is_killer: false }], [{ id: 'p', character_id: 'victim' }, ...players(3)]).allowed).toBe(false);
});
test('duplicate characters block the distribution', () => {
  expect(sessionEligibility(game, chars, players(4).map(p => ({ ...p, character_id: 'c1' }))).allowed).toBe(false);
});
test('release covers the killer even if all players were assigned other characters', () => {
  const input = players(4).map((p, i) => ({ ...p, character_id: `c${i + 1}` }));
  const plan = planCharacterAssignments(chars, input, () => 0.5);
  expect(plan.some(a => a.characterId === 'c0')).toBe(true);
  expect(new Set(plan.map(a => a.characterId)).size).toBe(4);
  expect(sessionEligibility(game, chars, plan.map(a => ({ id: a.playerId, character_id: a.characterId })), true).allowed).toBe(true);
});
test('start is blocked when the killer loses their player after release', () => {
  expect(sessionEligibility(game, chars, players(4).map((p, i) => ({ ...p, character_id: `c${i + 1}` })), true).allowed).toBe(false);
});
test('start requires every player to have a character', () => {
  expect(sessionEligibility(game, chars, players(4), true).allowed).toBe(false);
});
test('language stays editable only in unreleased lobby', () => {
  expect(isSessionLanguageLocked({ status: 'lobby', characters_released_at: null })).toBe(false);
});
test('language locks immediately after release', () => {
  expect(isSessionLanguageLocked({ status: 'lobby', characters_released_at: '2026-10-17T17:43:00Z' })).toBe(true);
});
for (const status of ['running', 'paused', 'finished']) {
  test(`language remains locked when ${status}, even without release timestamp`, () => {
    expect(isSessionLanguageLocked({ status })).toBe(true);
  });
}

test('with fewer players than characters the first characters of the cast are dealt, killer first', () => {
  const cast = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, is_killer: i === 0, victim: false, sort_order: i }));
  const plan = planCharacterAssignments(cast, players(7), () => 0.99);
  expect(plan.map(a => a.characterId)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
});
test('a character order never takes a preassigned seat away from a player', () => {
  const cast = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, is_killer: i === 0, victim: false, sort_order: i }));
  const input = players(7).map((p, i) => (i === 0 ? { ...p, character_id: 'c9' } : p));
  const plan = planCharacterAssignments(cast, input, () => 0.5);
  expect(plan[0].characterId).toBe('c9');
  expect(plan.some(a => a.characterId === 'c0')).toBe(true);
  expect(new Set(plan.map(a => a.characterId)).size).toBe(7);
});
test('games without an order keep the random deal', () => {
  const cast = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, is_killer: i === 0, victim: false, sort_order: 0 }));
  expect(planCharacterAssignments(cast, players(4), () => 0).map(a => a.characterId)).not.toEqual(planCharacterAssignments(cast, players(4), () => 0.99).map(a => a.characterId));
});
