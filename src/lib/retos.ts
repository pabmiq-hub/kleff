import { z } from "zod";

export function normalizeRetoSlug(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}
export const retoSlugSchema = z.string().min(3).max(48).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/** Clave de unicidad del pseudónimo: sin tildes, mayúsculas ni espacios repetidos. */
export function nicknameKey(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export type MissionKind = "follow" | "post" | "story" | "ludoya" | "custom" | "connection";
export type MissionSeed = { category: "social" | "conexion"; kind: MissionKind; title: string };

export const DEFAULT_SOCIAL_MISSIONS: MissionSeed[] = [
  { category: "social", kind: "follow", title: "Sigue en Instagram a las cuentas del reto" },
  { category: "social", kind: "post", title: "Haz una publicación en redes etiquetando a las cuentas del reto" },
  { category: "social", kind: "story", title: "Sube una historia etiquetando a las cuentas del reto" },
  { category: "social", kind: "ludoya", title: "Registra en Ludoya una partida jugada hoy" },
];

export const DEFAULT_CONNECTION_MISSIONS: string[] = [
  "Haz que otra persona que esté jugando contigo bostece.",
  "Consigue que otra persona que esté jugando contigo termine tu frase.",
  "Dile a los demás jugadores que huele a caca de perro. Consigue que al menos dos miren sus zapatos.",
  "Consigue que otra persona que esté jugando contigo debata contigo hacia dónde está el Norte.",
  "Convence a otra persona que esté jugando contigo de que hay otra zona de juegos nueva fuera. Si te sigue, enséñale esta misión.",
  "Finge tener algo en el ojo. Consigue que otra persona que esté jugando contigo te lo revise.",
  "Consigue que otra persona que esté jugando contigo te diga su edad.",
  "Esconde esta carta en la comida de otra persona que esté jugando contigo y quédate a ver cuándo la encuentre.",
  "Consigue que otra persona que esté jugando contigo trate de tocarse la nariz con la lengua.",
  "Esconde esta carta en la caja de un juego. Consigue que otra persona que esté jugando contigo la encuentre.",
  "Haz una torre de objetos en equilibrio y consigue que otra persona que esté jugando contigo la tire.",
  "Consigue que otra persona que esté jugando contigo te rasque la espalda.",
  "Consigue que otra persona que esté jugando contigo repita lo que ha dicho. Dos veces.",
  "Consigue que otra persona que esté jugando contigo visite la cuenta de TikTok: @kleff.bcn",
  "Consigue que otra persona que esté jugando contigo te acuse de hacer trampas.",
  "Consigue que otra persona que esté jugando contigo se haga una selfie contigo. Debe ser con su móvil.",
  "Consigue que otra persona que esté jugando contigo choque los puños contigo. Dos veces.",
  "Haz que un jugador te haga un cumplido sobre tu pelo.",
  "Di mal una cita de una película y haz que otro jugador te corrija.",
  "Haz que un jugador te dé un choque de manos dos veces durante la noche de juegos.",
  "Haz que un jugador te diga «no eres feo/a».",
  "Haz que un jugador te dé un golpe.",
  "Haz que un jugador te pregunte si estás llorando.",
  "Haz que un jugador confiese un delito.",
  "Haz que un jugador haga un nudo en un globo.",
  "Dile a un jugador que algo se activa por voz. Haz que lo pruebe.",
  "Haz que un jugador diga algo en otro idioma.",
  "Haz que un jugador te imite.",
  "Haz que un jugador diga «se acabó el juego / la partida».",
  "Invéntate una palabra y haz que otro jugador te pregunte qué significa.",
];

export function defaultMissions(): MissionSeed[] {
  return [...DEFAULT_SOCIAL_MISSIONS, ...DEFAULT_CONNECTION_MISSIONS.map((title) => ({ category: "conexion" as const, kind: "connection" as const, title }))];
}

/** Elige `n` misiones distintas al azar, priorizando las menos repartidas para variar entre participantes. */
export function pickMissions<T extends { id: string }>(pool: T[], usage: Map<string, number>, n: number, rand: () => number = Math.random): T[] {
  const shuffled = pool.map((m) => ({ m, k: (usage.get(m.id) ?? 0) + rand() })).sort((a, b) => a.k - b.k);
  return shuffled.slice(0, Math.max(0, n)).map((x) => x.m);
}

/** Código de acceso legible (sin 0/O/1/I). */
export function makeAccessCode(rand: () => number = Math.random) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => abc[Math.floor(rand() * abc.length)]).join("");
}

/** Sorteo uniforme entre números aún no premiados. */
export function pickTicket<T extends { id: string }>(tickets: T[], alreadyWon: Set<string>, rand: () => number = Math.random): T | null {
  const pool = tickets.filter((t) => !alreadyWon.has(t.id));
  if (!pool.length) return null;
  return pool[Math.floor(rand() * pool.length)] ?? null;
}

export const isAvatarDataUrl = (v: string) => /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/.test(v) && v.length < 300_000;
