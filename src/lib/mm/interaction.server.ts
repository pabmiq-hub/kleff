import { db } from "./engine.server";
import { matchRoles, transferBalances, jointActionStatus } from "./interactions";
import { loadTr } from "./translate.server";

async function query(q: any) {
  const r = await q;
  if (r.error) throw new Error("No se pudo consultar las acciones de la partida");
  return r.data;
}
export async function interactionContext(sessionId: string) {
  const s = await query(db().from("mm_sessions").select("*").eq("id", sessionId).single());
  const [players, acts, joint, inventory, wallets] = await Promise.all([
    query(db().from("mm_session_players").select("id, character_id, display_name").eq("session_id", sessionId)),
    query(db().from("mm_acts").select("id, position, key").eq("game_id", s.game_id)),
    query(db().from("mm_joint_actions").select("*").eq("game_id", s.game_id)),
    query(db().from("mm_inventory").select("*, mm_items(*)").eq("session_id", sessionId)),
    query(db().from("mm_wallets").select("*").in("session_player_id", (await query(db().from("mm_session_players").select("id").eq("session_id", sessionId))).map((p: any) => p.id))),
  ]);
  const ids = players.map((p: any) => p.character_id).filter(Boolean);
  const [chars, abilities, uses, fragments] = ids.length ? await Promise.all([
    query(db().from("mm_characters").select("id, ref").in("id", ids)),
    query(db().from("mm_abilities").select("*").in("character_id", ids)),
    query(db().from("mm_player_abilities").select("*").in("session_player_id", players.map((p: any) => p.id))),
    query(db().from("mm_fragments").select("*").in("character_id", ids)),
  ]) : [[], [], [], []];
  const cur = acts.find((a: any) => a.id === s.current_act_id)?.position ?? 0;
  const reached = (id: string | null) => !id || acts.some((a: any) => a.id === id && a.position <= cur);
  const resources = [
    ...inventory.filter((i: any) => reached(i.mm_items.available_from_act_id)).map((i: any) => ({ ...i.mm_items, player_id: i.owner_id, kind: "item" })),
    ...abilities.filter((a: any) => reached(a.available_from_act_id)).map((a: any) => ({ ...a, player_id: players.find((p: any) => p.character_id === a.character_id)?.id, kind: "ability", uses_left: uses.find((u: any) => u.ability_id === a.id)?.uses_left ?? a.max_uses })),
    ...fragments.map((f: any) => ({ ...f, name: f.label, player_id: players.find((p: any) => p.character_id === f.character_id)?.id, kind: "fragment" })),
  ];
  return { s, players: players.map((p: any) => ({ ...p, ref: chars.find((c: any) => c.id === p.character_id)?.ref })), resources, joint: joint.filter((j: any) => reached(j.available_from_act_id)), wallets, acts };
}

export async function interact(playerId: string, sessionId: string, input: any) {
  const c = await interactionContext(sessionId);
  const tr = await loadTr(c.s.game_id, c.s.language);
  if (c.s.status !== "running") throw new Error("La partida no está activa");
  const me = c.players.find((p: any) => p.id === playerId);
  if (!me?.character_id) throw new Error("No tienes personaje asignado");
  let command = "propose";
  let plan: any = {};
  if (["respond", "cancel"].includes(input.kind)) {
    if (!input.requestId) throw new Error("Falta la propuesta");
    command = input.kind === "cancel" ? "cancel" : input.accept ? "accept" : "reject";
  } else {
    if (new Set(input.targetIds).size !== input.targetIds.length || input.targetIds.includes(playerId)) throw new Error("Destinatarios no válidos");
    const people = [me, ...input.targetIds.map((id: string) => c.players.find((p: any) => p.id === id))];
    if (people.some(p => !p?.character_id)) throw new Error("Destinatario no válido");
    plan = { kind: input.kind, source_id: input.sourceId ?? "money", targets: input.targetIds, act_id: c.s.current_act_id, resources: [], results: [], unlocks: [], money: [] };
    if (input.kind === "money") {
      if (input.targetIds.length !== 1 || !input.amount) throw new Error("Elige destinatario y cantidad");
      transferBalances(c.wallets.find((w: any) => w.session_player_id === me.id)?.amount ?? 0, c.wallets.find((w: any) => w.session_player_id === people[1].id)?.amount ?? 0, input.amount);
      plan.amount = input.amount; plan.title = "Pago";
    } else if (input.kind === "item") {
      const item = c.resources.find((r: any) => r.id === input.sourceId && r.player_id === me.id && r.kind === "item");
      if (!item || input.targetIds.length !== 1) throw new Error("Objeto o destinatario no válido");
      plan.title = item.name;
      plan.resources = [{ kind: "item", id: item.id, player_id: me.id }];
      // Receiver always gets a notice; items may also carry an on_receive text/evidence.
      const receiver = people[1];
      const onReceive = item.use_config?.on_receive ?? {};
      plan.results.push({ player_id: receiver.id, text: `Has recibido «${item.name}». Ya está en tu inventario.` });
      if (onReceive.text) plan.results.push({ player_id: receiver.id, text: onReceive.text });
      if (onReceive.evidence) {
        const evidence = await query(db().from("mm_evidences").select("id, title, unlock_rule").eq("game_id", c.s.game_id));
        const ev = evidence.find((e: any) => [e.id, e.title, e.unlock_rule?.ref].includes(onReceive.evidence));
        if (ev) plan.unlocks.push({ player_id: receiver.id, evidence_id: ev.id });
      }
    } else {
      let results: any[] = [];
      let roles: any[] = people.map(p => ({ ...p, role: "all" }));
      if (input.kind === "joint") {
        const raw = c.joint.find((x: any) => x.id === input.sourceId);
        if (!raw) throw new Error("Acción no disponible");
        const j = tr.row("mm_joint_actions", raw);
        roles = matchRoles(j.requirements, people, c.resources);
        plan.joint_id = j.id; plan.title = j.name; plan.proposal_text = j.proposal_text ?? j.description;
        results = j.results;
        for (const role of roles) for (const k of ["ability", "item"]) {
          const ref = role.requirement[k];
          if (ref) {
            const r = c.resources.find((r: any) => r.player_id === role.id && r.kind === k && [r.id, r.ref, r.name].includes(ref));
            if (r) plan.resources.push({ kind: k, id: r.id, player_id: role.id });
          }
        }
      } else {
        const raw = c.resources.find((r: any) => r.id === input.sourceId && r.player_id === me.id && r.kind === "ability" && r.uses_left > 0);
        if (!raw || input.targetIds.length !== 1) throw new Error("Habilidad o destinatario no válido");
        const a = tr.row("mm_abilities", raw);
        if (a.use_config?.action) throw new Error("Utiliza esta habilidad desde la acción conjunta correspondiente");
        const config = a.effect_config ?? {};
        results = config.results ?? (config.text ? [{ text: config.text }] : config.evidence ? [{ evidence: config.evidence }] : []);
        if (!results.length) throw new Error("Esta habilidad necesita un resultado configurado en el JSON");
        plan.title = a.name; plan.proposal_text = a.use_config?.proposal_text ?? a.description;
        plan.resources = [{ kind: "ability", id: a.id, player_id: me.id }];
      }
      const evidence = await query(db().from("mm_evidences").select("id, title, unlock_rule").eq("game_id", c.s.game_id));
      for (const r of results) {
        const audience = r.role ? roles.filter(x => x.role === r.role) : roles;
        for (const p of audience) {
          if (r.text) plan.results.push({ player_id: p.id, text: r.text });
          if (Number.isInteger(r.money) && r.money !== 0) {
            const cur = c.wallets.find((w: any) => w.session_player_id === p.id)?.currency ?? "EUR";
            plan.money.push({ player_id: p.id, amount: r.money });
            plan.results.push({ player_id: p.id, text: r.money > 0 ? `+${r.money} ${cur} añadidos a tu cartera.` : `${r.money} ${cur} descontados de tu cartera.` });
          }
          if (r.evidence) {
            const ev = evidence.find((e: any) => [e.id, e.title, e.unlock_rule?.ref].includes(r.evidence));
            if (!ev) throw new Error("La evidencia de la acción no existe");
            plan.unlocks.push({ player_id: p.id, evidence_id: ev.id });
          }
          if (r.secret) throw new Error("Usa una evidencia personal para el resultado secreto de esta acción");
        }
      }
      // Combining all fragments of a group unlocks only its associated evidence.
      const ownedFragments = c.resources.filter((r: any) => r.kind === "fragment" && people.some(p => p.id === r.player_id));
      for (const ev of evidence.filter((e: any) => e.unlock_rule?.type === "fragments")) {
        const group = await query(db().from("mm_fragments").select("id").eq("game_id", c.s.game_id).eq("group_key", ev.unlock_rule.group_key));
        if (group.length && group.every((f: any) => ownedFragments.some((o: any) => o.id === f.id)))
          for (const p of people) plan.unlocks.push({ player_id: p.id, evidence_id: ev.id });
      }
    }
  }
  const result = await db().rpc("mm_commit_interaction", { _session: sessionId, _actor: playerId, _command: command, _request: input.requestId ?? null, _plan: plan });
  if (result.error) {
    const msg = result.error.message;
    if (/Saldo insuficiente|Habilidad agotada|objeto|acto|pendiente|completada|activa|destinatario/i.test(msg)) throw new Error(msg);
    throw new Error("No se pudo resolver la propuesta");
  }
}

export async function playerInteractionState(playerId: string, sessionId: string) {
  const c = await interactionContext(sessionId);
  const tr = await loadTr(c.s.game_id, c.s.language);
  const requests = await query(db().from("mm_action_requests").select("id, from_player, to_players, status, payload, result, created_at").eq("session_id", sessionId).or(`from_player.eq.${playerId},to_players.cs.{${playerId}}`).order("created_at", { ascending: false }));
  const myResources = c.resources.filter((r: any) => r.player_id === playerId);
  return {
    wallet: c.wallets.find((w: any) => w.session_player_id === playerId) ?? null,
    inventory: myResources.filter((r: any) => r.kind === "item").map((r: any) => { const i = tr.row("mm_items", r); return { id: i.id, name: i.name, description: i.description, type: i.type, image_url: i.image_url }; }),
    fragments: myResources.filter((r: any) => r.kind === "fragment").map((r: any) => ({ id: r.id, label: r.label, value: r.value, group_key: r.group_key })),
    joint_actions: c.s.status === "running" ? c.joint.filter((j: any) => j.requirements.some((r: any) => !r.character_id || r.character_id === "cualquiera" || r.character_id === c.players.find((p: any) => p.id === playerId)?.character_id)).map((raw: any) => {
      const j = tr.row("mm_joint_actions", raw);
      return { id: j.id, name: j.name, description: j.description, proposal_text: j.proposal_text, count: j.requirements.length, status: jointActionStatus(j.id, playerId, c.s.current_act_id, requests) };
    }) : [],
    requests: requests.map((r: any) => ({ id: r.id, from_player: r.from_player, to_players: r.to_players, status: r.status === "pending" && r.payload.act_id !== c.s.current_act_id ? "expired" : r.status, title: r.payload.title, proposal_text: r.payload.proposal_text, kind: r.payload.kind, amount: r.payload.amount, accepted: r.payload.accepted ?? [], results: r.status === "completed" ? (r.result ?? []).filter((x: any) => x.player_id === playerId).map((x: any) => x.text) : [] })),
  };
}