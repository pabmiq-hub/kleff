// Castle map for players. Everything is filtered here: places/features from future acts never
// leave the server, and a feature's content/image only travels after the player examined it.
import { broadcast, db, logEvent, sessionTopic } from "./engine.server";
import { examineBlock, evidenceGoesTo, type Requires } from "./map-art";

async function loadContext(playerId: string) {
  const { data: me } = await db().from("mm_session_players").select("id, session_id, character_id").eq("id", playerId).single();
  if (!me) throw new Error("Jugador no encontrado");
  const { data: s } = await db().from("mm_sessions").select("id, game_id, status, current_act_id, characters_released_at").eq("id", me.session_id).single();
  const [{ data: game }, { data: acts }, { data: locs }, { data: feats }, { data: reads }] = await Promise.all([
    db().from("mm_games").select("map_url").eq("id", s.game_id).single(),
    db().from("mm_acts").select("id, position").eq("game_id", s.game_id),
    db().from("mm_locations").select("*").eq("game_id", s.game_id).order("sort_order"),
    db().from("mm_location_features").select("*").eq("game_id", s.game_id).order("sort_order"),
    db().from("mm_feature_reads").select("feature_id").eq("session_player_id", playerId),
  ]);
  const pos = (id: string | null) => (id ? (acts ?? []).find((a: any) => a.id === id)?.position ?? 0 : 0);
  const cur = s.status === "lobby" ? 0 : pos(s.current_act_id);
  const reached = (actId: string | null) => s.status !== "lobby" && (!actId || pos(actId) <= cur);
  const charId = s.characters_released_at ? me.character_id : null;

  let characterRef: string | null = null;
  let itemKeys: string[] = [];
  let abilityKeys: string[] = [];
  if (charId) {
    const [{ data: ch }, { data: inv }, { data: abil }] = await Promise.all([
      db().from("mm_characters").select("ref").eq("id", charId).single(),
      db().from("mm_inventory").select("mm_items(ref, name, available_from_act_id)").eq("session_id", s.id).eq("owner_id", playerId),
      db().from("mm_abilities").select("ref, name, available_from_act_id").eq("character_id", charId),
    ]);
    characterRef = ch?.ref ?? null;
    itemKeys = (inv ?? []).map((r: any) => r.mm_items).filter((i: any) => i && reached(i.available_from_act_id)).flatMap((i: any) => [i.ref, i.name].filter(Boolean));
    abilityKeys = (abil ?? []).filter((a: any) => reached(a.available_from_act_id)).flatMap((a: any) => [a.ref, a.name].filter(Boolean));
  }
  return { me, s, game, locs: (locs ?? []) as any[], feats: (feats ?? []) as any[], read: new Set((reads ?? []).map((r: any) => r.feature_id)), reached, charId, characterRef, itemKeys, abilityKeys };
}

type Ctx = Awaited<ReturnType<typeof loadContext>>;

function blockFor(ctx: Ctx, f: any, loc: any) {
  return examineBlock(f.requires as Requires, {
    running: ctx.s.status === "running",
    hasCharacter: !!ctx.charId,
    available: ctx.reached(loc?.act_id ?? null) && ctx.reached(f.act_id),
    characterRef: ctx.characterRef,
    itemKeys: ctx.itemKeys,
    abilityKeys: ctx.abilityKeys,
  });
}

export async function playerMapState(playerId: string) {
  const ctx = await loadContext(playerId);
  if (!ctx.locs.length) return null;
  const evIds = ctx.feats.filter((f) => f.evidence_id && ctx.read.has(f.id)).map((f) => f.evidence_id);
  const { data: evs } = evIds.length ? await db().from("mm_evidences").select("id, title, scope, target_character_id").in("id", evIds) : { data: [] };
  const locations = ctx.locs
    .filter((l) => ctx.reached(l.act_id))
    .map((l) => {
      const features = ctx.feats
        .filter((f) => f.location_id === l.id && ctx.reached(f.act_id))
        .map((f) => {
          const read = ctx.read.has(f.id);
          const block = read ? null : blockFor(ctx, f, l);
          const locked = !read && !!block;
          const ev = read && f.evidence_id ? (evs ?? []).find((e: any) => e.id === f.evidence_id) : null;
          return {
            id: f.id,
            name: f.name,
            teaser: f.teaser,
            locked,
            locked_hint: locked ? f.locked_hint ?? block : null,
            read,
            content: read ? f.content : null,
            image_url: read ? f.image_url : null,
            evidence_title: ev && evidenceGoesTo(ev, ctx.charId) ? ev.title : null,
          };
        });
      return { id: l.id, name: l.name, description: l.description, x: Number(l.x), y: Number(l.y), image_url: l.image_url, features, pending: features.filter((f) => !f.read && !f.locked).length };
    });
  return { map_url: ctx.game?.map_url ?? null, locations };
}

export async function consultFeature(playerId: string, featureId: string) {
  const ctx = await loadContext(playerId);
  const f = ctx.feats.find((x) => x.id === featureId);
  const loc = f ? ctx.locs.find((l) => l.id === f.location_id) : null;
  // Unknown or not-yet-visible features answer the same way, so their existence is not leaked.
  if (!f || !loc || !ctx.reached(loc.act_id) || !ctx.reached(f.act_id)) throw new Error("Todavía no puedes examinar esto");
  if (ctx.read.has(f.id)) return { content: f.content, image_url: f.image_url, evidence_title: null, first: false };
  const block = blockFor(ctx, f, loc);
  if (block) throw new Error(block);

  const { data: inserted } = await db()
    .from("mm_feature_reads")
    .upsert({ session_player_id: playerId, feature_id: f.id, session_id: ctx.s.id }, { onConflict: "session_player_id,feature_id", ignoreDuplicates: true })
    .select("feature_id");
  const first = (inserted ?? []).length > 0;
  let evidenceTitle: string | null = null;
  if (first && f.evidence_id) {
    const { data: ev } = await db().from("mm_evidences").select("id, title, scope, target_character_id").eq("id", f.evidence_id).single();
    if (ev && evidenceGoesTo(ev, ctx.charId)) {
      const { data: had } = await db().from("mm_player_unlocks").select("id").eq("session_player_id", playerId).eq("evidence_id", ev.id).maybeSingle();
      if (!had) await db().from("mm_player_unlocks").insert({ session_player_id: playerId, evidence_id: ev.id, via: "map" });
      evidenceTitle = ev.title;
    }
  }
  if (first) {
    await logEvent(ctx.s.id, "feature_consulted", { location: loc.name, feature: f.name, evidence: evidenceTitle }, playerId);
    await broadcast(sessionTopic(ctx.s.id), "map", {});
  }
  return { content: f.content, image_url: f.image_url, evidence_title: evidenceTitle, first };
}
