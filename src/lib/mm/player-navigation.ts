export const CHARACTER_TABS = ["personaje", "secretos", "objetivos"] as const;
export type CharacterTabId = (typeof CHARACTER_TABS)[number];
export type PlayerTab = CharacterTabId | "inventario" | "evidencias" | "mapa" | "acciones" | "acusacion";
export type MainPlayerTab = "personaje" | "inventario" | "evidencias" | "mapa" | "acciones";

export function playerMainTabs(hasMap: boolean): MainPlayerTab[] {
  return hasMap
    ? ["personaje", "inventario", "evidencias", "mapa", "acciones"]
    : ["personaje", "inventario", "evidencias", "acciones"];
}

export function isCharacterTab(tab: string): tab is CharacterTabId {
  return CHARACTER_TABS.some((id) => id === tab);
}

export function playerSection(tab: PlayerTab): MainPlayerTab | null {
  return isCharacterTab(tab) ? "personaje" : tab === "acusacion" ? null : tab;
}

export function votingPrompt(votingOpen: boolean, hasVote: boolean): "accuse" | "recorded" | null {
  return hasVote ? "recorded" : votingOpen ? "accuse" : null;
}