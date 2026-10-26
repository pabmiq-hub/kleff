import { z } from "zod";

export const ART_KIND_LABEL = {
  item: "Objetos",
  evidence: "Evidencias",
  map: "Plano",
  location: "Salas",
  feature: "Elementos del mapa",
} as const;

export type GameArtKind = keyof typeof ART_KIND_LABEL;
export type GameArtEntry = {
  id: string;
  kind: GameArtKind;
  name: string;
  image_url: string | null;
  context: string | null;
};

export const regenerateArtSchema = z.object({
  gameId: z.string().uuid(),
  kind: z.enum(["item", "evidence", "map", "location", "feature"]),
  artId: z.string().uuid(),
});
export type RegenerateArtInput = z.infer<typeof regenerateArtSchema>;