import { z } from "zod";

export function normalizeContestSlug(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
export const contestSlugSchema = z.string().min(3).max(48).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export type ContestVote = { category_id: string; entry_id: string };
/** Any number of votes, several per category allowed; only for entries competing in that category, without duplicates. */
export function validVotes(votes: ContestVote[], entryCategories: ContestVote[]) {
  const allowed = new Set(entryCategories.map((e) => `${e.entry_id}:${e.category_id}`));
  const seen = new Set<string>();
  return votes.filter((v) => {
    const k = `${v.entry_id}:${v.category_id}`;
    if (!allowed.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map(({ category_id, entry_id }) => ({ category_id, entry_id }));
}

/** Ranking per category, most votes first. */
export function tally(
  categories: { id: string; name: string }[],
  entryCategories: { entry_id: string; category_id: string }[],
  votes: { category_id: string; entry_id: string }[],
) {
  return categories.map((c) => {
    const counts = new Map<string, number>();
    for (const ec of entryCategories) if (ec.category_id === c.id) counts.set(ec.entry_id, 0);
    for (const v of votes) if (v.category_id === c.id && counts.has(v.entry_id)) counts.set(v.entry_id, counts.get(v.entry_id)! + 1);
    const ranking = [...counts].map(([entry_id, votes]) => ({ entry_id, votes })).sort((a, b) => b.votes - a.votes);
    return { category_id: c.id, name: c.name, ranking };
  });
}

/** Uniform random pick among voters who cast at least one vote. */
export function pickRaffleWinner<T>(voters: T[], rand: () => number = Math.random): T | null {
  if (!voters.length) return null;
  return voters[Math.floor(rand() * voters.length)];
}
