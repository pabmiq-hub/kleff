// @ts-nocheck
// «Rompe-hielos» — configurable icebreaker games for social events.
// Stored in `events.social_game` (kept for backwards compatibility) as:
// { enabled, questions?, games: { who_is_who: {...}, build_yourself: {...} } }

import {
  DEFAULT_SOCIAL_GAME_QUESTIONS,
  type SocialGameQuestion,
} from "./socialGame";

export type IcebreakerGameCode = "who_is_who" | "build_yourself" | "timeline" | "emoji_story";

export interface WhoIsWhoConfig {
  enabled: boolean;
  questions: SocialGameQuestion[];
}

export interface BuildYourselfConfig {
  enabled: boolean;
  build_seconds: number;
  allow_drawing: boolean;
  prefill: boolean;
}

export interface TimelineConfig {
  enabled: boolean;
  create_seconds: number;
  guess_seconds: number;
}

export interface EmojiStoryConfig {
  enabled: boolean;
  compose_seconds: number;
  guess_seconds: number;
}

export interface IcebreakersConfig {
  enabled: boolean;
  games: {
    who_is_who: WhoIsWhoConfig;
    build_yourself: BuildYourselfConfig;
    timeline: TimelineConfig;
    emoji_story: EmojiStoryConfig;
  };
}

export const DEFAULT_BUILD_SECONDS = 90;
export const DEFAULT_TIMELINE_CREATE_SECONDS = 60;
export const DEFAULT_TIMELINE_GUESS_SECONDS = 60;
export const DEFAULT_EMOJI_COMPOSE_SECONDS = 60;
export const DEFAULT_EMOJI_GUESS_SECONDS = 45;

export const ICEBREAKER_META: Record<
  IcebreakerGameCode,
  { emoji: string; name_es: string; name_en: string; tagline_es: string; tagline_en: string; steps_es: string[]; steps_en: string[] }
> = {
  who_is_who: {
    emoji: "🎭",
    name_es: "¿Quién es quién?",
    name_en: "Who's who?",
    tagline_es: "Adivina quién escribió cada respuesta",
    tagline_en: "Guess who wrote each answer",
    steps_es: [
      "En cada ronda verás dos preguntas con las respuestas anónimas de tu mesa.",
      "Asigna cada respuesta a la persona que crees que la escribió.",
      "Se revela al instante si has acertado.",
      "1 acierto → Super Like extra · 3 aciertos → también Repetir · pleno → también Flechazo.",
    ],
    steps_en: [
      "Each round shows two questions with anonymous answers from your table.",
      "Assign every answer to the person you think wrote it.",
      "You instantly find out whether you got it right.",
      "1 hit → extra Super Like · 3 hits → also Repeat · perfect → also Crush.",
    ],
  },
  build_yourself: {
    emoji: "🧑‍🎨",
    name_es: "Constrúyete",
    name_en: "Build yourself",
    tagline_es: "Crea tu avatar y adivina el del resto",
    tagline_en: "Create your avatar and guess the others",
    steps_es: [
      "Construye un avatar que te represente: piezas de pelo, cara, ropa y complementos divertidos.",
      "Algunas piezas vienen presugeridas según lo que contaste en el formulario: puedes quitarlas.",
      "Cuando todos en tu mesa estéis listos, empieza una cuenta atrás.",
      "Se muestran los avatares sin nombre y hay que adivinar de quién es cada uno.",
      "1 acierto → Super Like extra · 3 aciertos → también Repetir · pleno → también Flechazo.",
    ],
    steps_en: [
      "Build an avatar that represents you: hair, face, clothes and fun accessories.",
      "Some pieces are pre-filled from your registration answers — you can remove them.",
      "Once everyone at your table is ready, a countdown starts.",
      "Avatars are shown without names and you have to guess who is who.",
      "1 hit → extra Super Like · 3 hits → also Repeat · perfect → also Crush.",
    ],
  },
  timeline: {
    emoji: "🕰️",
    name_es: "Timeline",
    name_en: "Timeline",
    tagline_es: "Ordena los hitos de cada persona",
    tagline_en: "Order everyone's milestones",
    steps_es: [
      "Recibes 4-5 hitos generados a partir de tus hobbies y respuestas.",
      "Ordénalos cronológicamente en tu propia línea de tiempo (tienes un tiempo limitado).",
      "Por turnos, una persona es la protagonista y el resto de la mesa ordena su timeline.",
      "Se revela el orden real y se cuentan los aciertos del grupo.",
      "Acertar el orden exacto → Super Like extra · varios turnos acertados → también Repetir y Flechazo.",
    ],
    steps_en: [
      "You get 4-5 milestones generated from your hobbies and answers.",
      "Order them chronologically on your own timeline (there is a time limit).",
      "In turns, one person is the protagonist and the rest of the table orders their timeline.",
      "The real order is revealed and the group's hits are counted.",
      "Exact order → extra Super Like · several correct turns → also Repeat and Crush.",
    ],
  },
  emoji_story: {
    emoji: "🧩",
    name_es: "Emoji Story",
    name_en: "Emoji Story",
    tagline_es: "Cuenta tu historia solo con emojis",
    tagline_en: "Tell your story with emojis only",
    steps_es: [
      "Recibes una pregunta personalizada según tus respuestas del formulario.",
      "Contesta con 4-6 emojis y escribe (solo para ti) la historia real detrás.",
      "Cuando la mesa está lista, se muestran las historias de emojis sin nombre.",
      "Adivinad en voz alta la historia y asigna cada secuencia a su autor/a.",
      "Al votar se revela el texto real que había pensado esa persona.",
      "1 acierto → Super Like extra · 3 aciertos → también Repetir · pleno → también Flechazo.",
    ],
    steps_en: [
      "You get a personalised prompt based on your registration answers.",
      "Reply with 4-6 emojis and write (just for you) the real story behind it.",
      "Once the table is ready, the emoji stories are shown without names.",
      "Guess the story out loud and assign each sequence to its author.",
      "Voting reveals the real text that person had in mind.",
      "1 hit → extra Super Like · 3 hits → also Repeat · perfect → also Crush.",
    ],
  },
};

export const ICEBREAKER_ORDER: IcebreakerGameCode[] = ["who_is_who", "build_yourself", "timeline", "emoji_story"];

export function normalizeIcebreakers(source: unknown): IcebreakersConfig {
  const raw = (source || {}) as any;
  const games = (raw.games || {}) as any;

  // Legacy shape: { enabled, questions } === «¿Quién es quién?» only.
  const legacyQuestions = Array.isArray(raw.questions) ? raw.questions : null;
  const rawQuestions = Array.isArray(games?.who_is_who?.questions) && games.who_is_who.questions.length > 0
    ? games.who_is_who.questions
    : legacyQuestions;

  const questions: SocialGameQuestion[] = Array.isArray(rawQuestions) && rawQuestions.length > 0
    ? rawQuestions
        .filter((q: any) => q && typeof q.id === "string")
        .map((q: any) => ({
          id: String(q.id),
          label_es: String(q.label_es || ""),
          label_en: String(q.label_en || q.label_es || ""),
        }))
    : DEFAULT_SOCIAL_GAME_QUESTIONS;

  const hasGames = !!raw.games;
  const build = (games.build_yourself || {}) as any;
  const timeline = (games.timeline || {}) as any;
  const emoji = (games.emoji_story || {}) as any;
  const secs = (v: unknown, fallback: number) =>
    Number(v) > 0 ? Math.min(600, Math.max(15, Math.round(Number(v)))) : fallback;

  return {
    enabled: !!raw.enabled,
    games: {
      who_is_who: {
        // Legacy events had no `games` key: the whole feature was «¿Quién es quién?».
        enabled: hasGames ? !!games.who_is_who?.enabled : !!raw.enabled,
        questions,
      },
      build_yourself: {
        enabled: !!build.enabled,
        build_seconds: Number(build.build_seconds) > 0 ? Math.min(600, Math.round(Number(build.build_seconds))) : DEFAULT_BUILD_SECONDS,
        allow_drawing: build.allow_drawing === undefined ? true : !!build.allow_drawing,
        prefill: build.prefill === undefined ? true : !!build.prefill,
      },
      timeline: {
        enabled: !!timeline.enabled,
        create_seconds: secs(timeline.create_seconds, DEFAULT_TIMELINE_CREATE_SECONDS),
        guess_seconds: secs(timeline.guess_seconds, DEFAULT_TIMELINE_GUESS_SECONDS),
      },
      emoji_story: {
        enabled: !!emoji.enabled,
        compose_seconds: secs(emoji.compose_seconds, DEFAULT_EMOJI_COMPOSE_SECONDS),
        guess_seconds: secs(emoji.guess_seconds, DEFAULT_EMOJI_GUESS_SECONDS),
      },
    },
  };
}

/** Persisted shape. Keeps top-level `questions` so older readers keep working. */
export function serializeIcebreakers(cfg: IcebreakersConfig): Record<string, unknown> {
  return {
    enabled: cfg.enabled,
    questions: cfg.games.who_is_who.questions,
    games: {
      who_is_who: {
        enabled: cfg.games.who_is_who.enabled,
        questions: cfg.games.who_is_who.questions,
      },
      build_yourself: { ...cfg.games.build_yourself },
      timeline: { ...cfg.games.timeline },
      emoji_story: { ...cfg.games.emoji_story },
    },
  };
}

export function activeIcebreakerGames(cfg: IcebreakersConfig): IcebreakerGameCode[] {
  if (!cfg.enabled) return [];
  return ICEBREAKER_ORDER.filter((code) => cfg.games[code].enabled);
}

/** True when the participant panel should show the «Rompe-hielos» section. */
export function hasActiveIcebreakers(source: unknown): boolean {
  return activeIcebreakerGames(normalizeIcebreakers(source)).length > 0;
}

/** «¿Quién es quién?» requires answers at registration. */
export function requiresGameAnswers(source: unknown): boolean {
  const cfg = normalizeIcebreakers(source);
  return cfg.enabled && cfg.games.who_is_who.enabled;
}
