import type { GameArtEntry, RegenerateArtInput } from "./art-gallery";
import { generateItemArt } from "./item-art.server";
import { generateEvidenceArt } from "./evidence-art.server";
import { fillGameMapArt } from "./map-art.server";

/** Complete artwork is privileged: this helper is only called after an admin role check. */
export async function getGameArt(db: () => any, gameId: string): Promise<GameArtEntry[]> {
  const [gameResult, charsResult, evidenceResult, locationsResult, featuresResult] = await Promise.all([
    db().from("mm_games").select("id, map_url").eq("id", gameId).single(),
    db().from("mm_characters").select("id, name").eq("game_id", gameId).order("sort_order"),
    db().from("mm_evidences").select("id, title, image_url, scope, target_character_id").eq("game_id", gameId).order("title"),
    db().from("mm_locations").select("id, name, image_url").eq("game_id", gameId).order("sort_order"),
    db().from("mm_location_features").select("id, name, location_id, image_url").eq("game_id", gameId).order("sort_order"),
  ]);
  for (const result of [gameResult, charsResult, evidenceResult, locationsResult, featuresResult]) {
    if (result.error) throw new Error("No se han podido cargar las ilustraciones del juego.");
  }
  if (!gameResult.data) throw new Error("Juego no encontrado");
  const characters = charsResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const characterName = (id: string) => characters.find((c: any) => c.id === id)?.name ?? null;
  const itemsResult = characters.length
    ? await db().from("mm_items").select("id, name, image_url, character_id").in("character_id", characters.map((c: any) => c.id)).order("name")
    : { data: [], error: null };
  if (itemsResult.error) throw new Error("No se han podido cargar los objetos del juego.");
  return [
    ...(itemsResult.data ?? []).map((i: any) => ({ id: i.id, kind: "item" as const, name: i.name, image_url: i.image_url, context: characterName(i.character_id) })),
    ...(evidenceResult.data ?? []).map((e: any) => ({ id: e.id, kind: "evidence" as const, name: e.title, image_url: e.image_url, context: e.scope === "personal" ? `Personal · ${characterName(e.target_character_id) ?? "Sin destinatario"}` : "Común" })),
    ...(locations.length || gameResult.data.map_url ? [{ id: gameId, kind: "map" as const, name: "Plano del juego", image_url: gameResult.data.map_url, context: null }] : []),
    ...locations.map((l: any) => ({ id: l.id, kind: "location" as const, name: l.name, image_url: l.image_url, context: null })),
    ...(featuresResult.data ?? []).map((f: any) => ({ id: f.id, kind: "feature" as const, name: f.name, image_url: f.image_url, context: locations.find((l: any) => l.id === f.location_id)?.name ?? null })),
  ];
}

/** Scope the selected row to its game before generating; never overwrite an existing drawing on failure. */
export async function regenerateGameArt(db: () => any, input: RegenerateArtInput): Promise<void> {
  const { gameId, kind, artId } = input;
  if (kind === "item" || kind === "evidence") {
    const table = kind === "item" ? "mm_items" : "mm_evidences";
    let query = db().from(table).select("*").eq("id", artId);
    if (kind === "item") {
      const { data: chars, error } = await db().from("mm_characters").select("id").eq("game_id", gameId);
      if (error || !chars?.length) throw new Error("Objeto no encontrado en este juego.");
      query = query.in("character_id", chars.map((c: any) => c.id));
    } else query = query.eq("game_id", gameId);
    const { data: row, error } = await query.single();
    if (error || !row) throw new Error("Ilustración no encontrada en este juego.");
    const url = kind === "item" ? await generateItemArt(row) : await generateEvidenceArt(row);
    if (!url) throw new Error("No se ha podido crear el dibujo. Se conserva la imagen anterior.");
    const { error: saveError } = await db().from(table).update({ image_url: url }).eq("id", row.id);
    if (saveError) throw new Error("No se ha podido guardar el dibujo. Se conserva la imagen anterior.");
    return;
  }
  const result = await fillGameMapArt(db, gameId, { force: true, target: { kind, id: artId } });
  if (result.generated !== 1) throw new Error("No se ha podido crear el dibujo. Se conserva la imagen anterior.");
}