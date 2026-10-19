import { z } from "zod";

export const useSchema = z.object({
  mode: z.enum(["give_money", "give_item", "joint_action", "ability"]),
  action: z.string().optional(),
  requires_acceptance: z.boolean().default(true),
  proposal_text: z.string().optional(),
}).passthrough();
export const interactionInput = z.object({
  token: z.string().min(10), sessionId: z.string().uuid(),
  kind: z.enum(["money", "item", "ability", "joint", "respond", "cancel"]),
  sourceId: z.string().uuid().optional(), targetIds: z.array(z.string().uuid()).max(30).default([]),
  amount: z.number().int().positive().max(2147483647).optional(),
  requestId: z.string().uuid().optional(), accept: z.boolean().optional(),
});
export function transferBalances(from: number, to: number, amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > from || to + amount > 2147483647)
    throw new Error("Cantidad no válida o saldo insuficiente");
  return { from: from - amount, to: to + amount };
}
export function richestBonus(balance: number, balances: number[], award: number) {
  const max = Math.max(0, ...balances);
  return max > 0 && balance === max ? award : 0;
}
export function jointActionStatus(sourceId: string, playerId: string, actId: string | null, requests: any[]): "pending" | "completed" | null {
  const involved = requests.filter(r => r.payload?.kind === "joint" && r.payload.source_id === sourceId &&
    (r.from_player === playerId || r.to_players.includes(playerId)));
  if (involved.some(r => r.status === "completed")) return "completed";
  if (involved.some(r => r.status === "pending" && r.payload.act_id === actId)) return "pending";
  return null;
}
export function matchRoles(requirements: any[], participants: any[], resources: any[]) {
  if (participants.length !== requirements.length || new Set(participants.map(p => p.id)).size !== participants.length)
    throw new Error("Cada papel necesita un participante distinto");
  const assign = (i: number, remaining: any[], out: any[]): any[] | null => {
    if (i === requirements.length) return out;
    const r = requirements[i];
    for (const p of remaining) {
      if (r.character && !["cualquiera", "any", p.ref].includes(r.character)) continue;
      if (r.character_id && !["cualquiera", p.character_id].includes(r.character_id)) continue;
      const found = resources.filter(x => x.player_id === p.id);
      if (["item", "ability", "fragment"].some(k => r[k] && !found.some(x => x.kind === k && [x.ref, x.name, x.id, x.group_key].includes(r[k]) && (k !== "ability" || x.uses_left > 0)))) continue;
      const next = assign(i + 1, remaining.filter(x => x.id !== p.id), [...out, { ...p, role: r.role ?? String(i), requirement: r }]);
      if (next) return next;
    }
    return null;
  };
  const roles = assign(0, participants, []);
  if (!roles) throw new Error("No se cumplen los personajes, objetos o habilidades necesarios");
  return roles;
}