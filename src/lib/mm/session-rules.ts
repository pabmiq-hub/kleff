type GameLimits = { min_players: number; max_players: number };
type Character = { id: string; victim?: boolean; is_killer?: boolean | null };
type Player = { id: string; character_id?: string | null };

/** The murder belongs to the second act, regardless of its imported key or control mode. */
export function shouldTriggerMurder(act: { position: number }, session: { murder_triggered_at?: string | null }) {
  return act.position === 2 && !session.murder_triggered_at;
}

export function isSessionLanguageLocked(session: { status: string; characters_released_at?: string | null }) {
  return session.status !== "lobby" || Boolean(session.characters_released_at);
}

export function sessionEligibility(game: GameLimits, characters: Character[], players: Player[], requireAssignments = false) {
  const playable = characters.filter((c) => !c.victim);
  const minimum = game.min_players;
  const maximum = Math.min(game.max_players, playable.length);
  const missing = Math.max(0, minimum - players.length);
  const issues: string[] = [];
  if (missing) issues.push(`Faltan ${missing} jugador(es) para completar el mínimo de ${minimum}.`);
  if (minimum > maximum) issues.push("El juego no tiene suficientes personajes jugables para su mínimo de jugadores.");
  if (players.length > maximum) issues.push(`Hay ${players.length} jugadores, pero solo se pueden repartir ${maximum} personajes.`);
  const assigned = players.map((p) => p.character_id).filter((id): id is string => Boolean(id));
  if (assigned.some((id) => !playable.some((c) => c.id === id))) issues.push("Hay jugadores con un personaje no jugable o de otro juego.");
  if (new Set(assigned).size !== assigned.length) issues.push("Hay un personaje asignado a más de un jugador.");
  if (requireAssignments) {
    if (assigned.length !== players.length) issues.push("Todos los jugadores deben tener un personaje antes de iniciar.");
    if (playable.some((c) => c.is_killer && !assigned.includes(c.id))) issues.push("Falta cubrir un personaje imprescindible. Revisa el reparto antes de iniciar.");
  }
  return { minimum, maximum, registered: players.length, missing, issues, allowed: issues.length === 0 };
}

/** Keep valid assignments, but guarantee the killer is covered even when every seat was preassigned. */
export function planCharacterAssignments(characters: Character[], players: Player[], random = Math.random) {
  const playable = characters.filter((c) => !c.victim);
  const assignments = players.map((p) => ({ playerId: p.id, characterId: p.character_id ?? null }));
  const taken = new Set(assignments.map((a) => a.characterId).filter(Boolean));
  const free = playable.filter((c) => !taken.has(c.id));
  const others = free.filter((c) => !c.is_killer);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const queue = [...free.filter((c) => c.is_killer), ...others];
  for (const a of assignments) if (!a.characterId) a.characterId = queue.shift()?.id ?? null;
  for (const killer of playable.filter((c) => c.is_killer)) {
    if (assignments.some((a) => a.characterId === killer.id)) continue;
    const replace = [...assignments].reverse().find((a) => !playable.find((c) => c.id === a.characterId)?.is_killer);
    if (replace) replace.characterId = killer.id;
  }
  return assignments;
}