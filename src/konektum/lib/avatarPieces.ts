// @ts-nocheck
// Flat, geometric avatar piece catalog for the «Constrúyete» icebreaker.
// Pieces are pure data; rendering lives in AvatarCanvas.tsx.

export type AvatarLayers = Record<string, string>;

export interface AvatarOption {
  id: string;
  label_es: string;
  label_en: string;
  /** Colour swatch shown in the picker for colour categories. */
  color?: string;
}

export interface AvatarCategory {
  id: string;
  label_es: string;
  label_en: string;
  /** Colour categories render swatches instead of avatar previews. */
  kind: "shape" | "color";
  options: AvatarOption[];
}

const SKIN = ["#F7C7A3", "#EFB08C", "#D69A72", "#B87C56", "#8D5A3B", "#5E3A24"];
const HAIR = ["#2B2B33", "#5A3A22", "#A9622F", "#E2574C", "#F2C14E", "#8E6BC7", "#EDEDED"];
const CLOTH = ["#2ECC8F", "#E85D6E", "#4A6FA5", "#F2C14E", "#8E6BC7", "#41414B"];
const AURA = ["#FFD9DE", "#D8F3E6", "#DDE7F7", "#F7E9C9", "#EADDF7", "#F1F1F1"];

const c = (colors: string[], prefix: string): AvatarOption[] =>
  colors.map((color, i) => ({ id: `${prefix}${i + 1}`, label_es: `Tono ${i + 1}`, label_en: `Shade ${i + 1}`, color }));

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: "skin",
    label_es: "Piel",
    label_en: "Skin",
    kind: "color",
    options: c(SKIN, "skin"),
  },
  {
    id: "hair",
    label_es: "Pelo",
    label_en: "Hair",
    kind: "shape",
    options: [
      { id: "none", label_es: "Sin pelo", label_en: "None" },
      { id: "short", label_es: "Corto", label_en: "Short" },
      { id: "quiff", label_es: "Tupé", label_en: "Quiff" },
      { id: "long", label_es: "Largo", label_en: "Long" },
      { id: "bun", label_es: "Moño", label_en: "Bun" },
      { id: "curly", label_es: "Rizado", label_en: "Curly" },
      { id: "pigtails", label_es: "Coletas", label_en: "Pigtails" },
      { id: "beanie", label_es: "Gorro", label_en: "Beanie" },
    ],
  },
  {
    id: "hairColor",
    label_es: "Color de pelo",
    label_en: "Hair colour",
    kind: "color",
    options: c(HAIR, "hair"),
  },
  {
    id: "eyes",
    label_es: "Mirada",
    label_en: "Eyes",
    kind: "shape",
    options: [
      { id: "dots", label_es: "Puntos", label_en: "Dots" },
      { id: "happy", label_es: "Felices", label_en: "Happy" },
      { id: "wink", label_es: "Guiño", label_en: "Wink" },
      { id: "sleepy", label_es: "Dormilón", label_en: "Sleepy" },
      { id: "wide", label_es: "Sorpresa", label_en: "Surprised" },
      { id: "stars", label_es: "Estrellas", label_en: "Stars" },
    ],
  },
  {
    id: "mouth",
    label_es: "Boca",
    label_en: "Mouth",
    kind: "shape",
    options: [
      { id: "smile", label_es: "Sonrisa", label_en: "Smile" },
      { id: "grin", label_es: "Risa", label_en: "Grin" },
      { id: "smirk", label_es: "Pícara", label_en: "Smirk" },
      { id: "oh", label_es: "Asombro", label_en: "Oh!" },
      { id: "serious", label_es: "Seria", label_en: "Serious" },
      { id: "tongue", label_es: "Lengua", label_en: "Tongue" },
    ],
  },
  {
    id: "facialHair",
    label_es: "Vello facial",
    label_en: "Facial hair",
    kind: "shape",
    options: [
      { id: "none", label_es: "Nada", label_en: "None" },
      { id: "mustache", label_es: "Bigote", label_en: "Moustache" },
      { id: "goatee", label_es: "Perilla", label_en: "Goatee" },
      { id: "beard", label_es: "Barba", label_en: "Beard" },
      { id: "full", label_es: "Barbón", label_en: "Full beard" },
    ],
  },
  {
    id: "clothes",
    label_es: "Ropa",
    label_en: "Clothes",
    kind: "shape",
    options: [
      { id: "tee", label_es: "Camiseta", label_en: "T-shirt" },
      { id: "vneck", label_es: "Pico", label_en: "V-neck" },
      { id: "hoodie", label_es: "Sudadera", label_en: "Hoodie" },
      { id: "shirt", label_es: "Camisa", label_en: "Shirt" },
      { id: "stripes", label_es: "Rayas", label_en: "Stripes" },
      { id: "overalls", label_es: "Peto", label_en: "Overalls" },
    ],
  },
  {
    id: "clothesColor",
    label_es: "Color de ropa",
    label_en: "Clothes colour",
    kind: "color",
    options: c(CLOTH, "cloth"),
  },
  {
    id: "glasses",
    label_es: "Gafas",
    label_en: "Glasses",
    kind: "shape",
    options: [
      { id: "none", label_es: "Nada", label_en: "None" },
      { id: "round", label_es: "Redondas", label_en: "Round" },
      { id: "square", label_es: "Cuadradas", label_en: "Square" },
      { id: "sun", label_es: "De sol", label_en: "Sunglasses" },
      { id: "sport", label_es: "Deportivas", label_en: "Sporty" },
    ],
  },
  {
    id: "accessory",
    label_es: "Complemento",
    label_en: "Accessory",
    kind: "shape",
    options: [
      { id: "none", label_es: "Nada", label_en: "None" },
      { id: "headphones", label_es: "Auriculares gaming", label_en: "Gaming headset" },
      { id: "headband", label_es: "Cinta deportiva", label_en: "Sport headband" },
      { id: "earrings", label_es: "Pendientes", label_en: "Earrings" },
      { id: "necklace", label_es: "Collar", label_en: "Necklace" },
      { id: "flower", label_es: "Flor", label_en: "Flower" },
      { id: "cap", label_es: "Gorra", label_en: "Cap" },
    ],
  },
  {
    id: "fun",
    label_es: "Toque divertido",
    label_en: "Fun twist",
    kind: "shape",
    options: [
      { id: "none", label_es: "Nada", label_en: "None" },
      { id: "pet", label_es: "Mascota", label_en: "Pet" },
      { id: "coffee", label_es: "Café", label_en: "Coffee" },
      { id: "guitar", label_es: "Guitarra", label_en: "Guitar" },
      { id: "book", label_es: "Libro", label_en: "Book" },
      { id: "sparkles", label_es: "Chispas", label_en: "Sparkles" },
      { id: "balloon", label_es: "Globo", label_en: "Balloon" },
    ],
  },
  {
    id: "aura",
    label_es: "Aura",
    label_en: "Aura",
    kind: "color",
    options: [{ id: "none", label_es: "Sin aura", label_en: "No aura" }, ...c(AURA, "aura")],
  },
];

/** Where a hand-drawn accessory can be placed on the avatar (200x200 viewBox). */
export const DRAWING_SLOT_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  above_head: { x: 58, y: -4, w: 84, h: 58 },
  hand_right: { x: 122, y: 112, w: 74, h: 74 },
  hand_left: { x: 4, y: 112, w: 74, h: 74 },
  chest: { x: 70, y: 146, w: 60, h: 50 },
  side: { x: 132, y: 34, w: 64, h: 64 },
  background: { x: 0, y: 0, w: 200, h: 200 },
};

export const DRAWING_SLOTS: { id: string; label_es: string; label_en: string }[] = [
  { id: "hand_right", label_es: "En la mano derecha", label_en: "Right hand" },
  { id: "hand_left", label_es: "En la mano izquierda", label_en: "Left hand" },
  { id: "above_head", label_es: "Sobre la cabeza", label_en: "Above the head" },
  { id: "chest", label_es: "En el pecho", label_en: "On the chest" },
  { id: "side", label_es: "Al lado", label_en: "Beside" },
  { id: "background", label_es: "De fondo", label_en: "Background" },
];

export const DEFAULT_AVATAR: AvatarLayers = {
  skin: "skin1",
  hair: "short",
  hairColor: "hair1",
  eyes: "dots",
  mouth: "smile",
  facialHair: "none",
  clothes: "tee",
  clothesColor: "cloth1",
  glasses: "none",
  accessory: "none",
  fun: "none",
  aura: "none",
  drawingSlot: "full",
};

export function colorFor(categoryId: string, optionId: string | undefined): string | undefined {
  const cat = AVATAR_CATEGORIES.find((x) => x.id === categoryId);
  return cat?.options.find((o) => o.id === optionId)?.color;
}

export function randomAvatar(): AvatarLayers {
  const layers: AvatarLayers = {};
  for (const cat of AVATAR_CATEGORIES) {
    const opts = cat.options;
    layers[cat.id] = opts[Math.floor(Math.random() * opts.length)].id;
  }
  return { ...DEFAULT_AVATAR, ...layers };
}

/** Keyword → suggested piece, derived from what the participant already declared. */
const PREFILL_RULES: { keywords: string[]; layers: AvatarLayers; reason_es: string; reason_en: string }[] = [
  { keywords: ["deport", "sport", "gym", "fitness", "running", "correr", "futbol", "fútbol", "padel", "pádel", "yoga"], layers: { accessory: "headband" }, reason_es: "Deporte", reason_en: "Sports" },
  { keywords: ["gamer", "gaming", "videojuego", "video game", "esport"], layers: { accessory: "headphones" }, reason_es: "Gaming", reason_en: "Gaming" },
  { keywords: ["música", "musica", "music", "concierto", "concert", "guitarra", "guitar", "cantar", "sing"], layers: { fun: "guitar" }, reason_es: "Música", reason_en: "Music" },
  { keywords: ["leer", "lectura", "book", "read", "libro"], layers: { fun: "book" }, reason_es: "Lectura", reason_en: "Reading" },
  { keywords: ["café", "cafe", "coffee", "brunch"], layers: { fun: "coffee" }, reason_es: "Café", reason_en: "Coffee" },
  { keywords: ["perro", "gato", "dog", "cat", "mascota", "pet", "animal"], layers: { fun: "pet" }, reason_es: "Animales", reason_en: "Animals" },
  { keywords: ["fiesta", "party", "baile", "dance", "festival"], layers: { fun: "balloon" }, reason_es: "Fiesta", reason_en: "Party" },
  { keywords: ["viaj", "travel", "mochil", "backpack"], layers: { accessory: "cap" }, reason_es: "Viajes", reason_en: "Travel" },
  { keywords: ["playa", "beach", "surf", "sol", "verano", "summer"], layers: { glasses: "sun" }, reason_es: "Sol y playa", reason_en: "Sun & beach" },
  { keywords: ["cine", "film", "movie", "serie", "netflix"], layers: { aura: "aura3" }, reason_es: "Cine y series", reason_en: "Film & series" },
  { keywords: ["natural", "montaña", "montana", "hiking", "senderismo", "planta"], layers: { aura: "aura2" }, reason_es: "Naturaleza", reason_en: "Nature" },
  { keywords: ["arte", "art", "pint", "draw", "dibuj", "diseñ", "design"], layers: { aura: "aura5" }, reason_es: "Arte", reason_en: "Art" },
];

export interface PrefillSuggestion {
  category: string;
  option: string;
  reason_es: string;
  reason_en: string;
}

/**
 * Suggested pieces from free-text hints (hobbies, lifestyle, wrapped answers).
 * Returns at most 4 suggestions, one per category.
 */
export function suggestFromProfile(hints: string[]): PrefillSuggestion[] {
  const haystack = hints.map((h) => String(h || "").toLowerCase()).join(" | ");
  const used = new Set<string>();
  const out: PrefillSuggestion[] = [];
  for (const rule of PREFILL_RULES) {
    if (out.length >= 4) break;
    if (!rule.keywords.some((k) => haystack.includes(k))) continue;
    for (const [category, option] of Object.entries(rule.layers)) {
      if (used.has(category)) continue;
      used.add(category);
      out.push({ category, option, reason_es: rule.reason_es, reason_en: rule.reason_en });
    }
  }
  return out;
}
