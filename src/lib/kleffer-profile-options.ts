/** Opciones compartidas del "perfil de kleffer" (cliente + servidor). */
import type { AppLocale } from "@/i18n/app-i18n";

export const ATTENDS_ALONE = [
  { value: "alone", label: "Suelo venir solo/a" },
  { value: "with_friends", label: "Suelo venir con amigos" },
  { value: "depends", label: "Depende del día" },
] as const;

export const SCHEDULED_GAMES = [
  { value: "yes", label: "Sí, me apunto a partidas programadas" },
  { value: "improvise", label: "Prefiero improvisar al llegar" },
  { value: "depends", label: "Según el juego" },
] as const;

export const GOALS = [
  { value: "friends", label: "Hacer nuevas amistades" },
  { value: "play", label: "Jugar mucho" },
  { value: "community", label: "Participar en la comunidad" },
  { value: "organize", label: "Organizar partidas" },
  { value: "compete", label: "Competir en torneos" },
  { value: "discover", label: "Descubrir novedades" },
] as const;

export const GAME_TYPES = [
  { value: "euro", label: "Eurogames" },
  { value: "party", label: "Party" },
  { value: "hidden_roles", label: "Roles ocultos" },
  { value: "coop", label: "Cooperativos" },
  { value: "wargames", label: "Wargames" },
  { value: "family", label: "Familiares" },
  { value: "deduction", label: "Deducción" },
  { value: "abstract", label: "Abstractos" },
  { value: "rpg", label: "Rol / narrativos" },
] as const;

export const EXPERIENCE = [
  { value: "novice", label: "Novato/a" },
  { value: "regular", label: "Habitual" },
  { value: "veteran", label: "Veterano/a" },
] as const;

export const AVAILABILITY = [
  { value: "weekday_afternoon", label: "Entre semana, tarde" },
  { value: "weekday_evening", label: "Entre semana, noche" },
  { value: "friday_evening", label: "Viernes noche" },
  { value: "saturday_morning", label: "Sábado mañana" },
  { value: "saturday_afternoon", label: "Sábado tarde" },
  { value: "saturday_evening", label: "Sábado noche" },
  { value: "sunday", label: "Domingo" },
] as const;

export const LANGUAGES = [
  { value: "ca", label: "Català" },
  { value: "es", label: "Castellano" },
  { value: "en", label: "English" },
  { value: "other", label: "Otro" },
] as const;

export const TEACHES = [
  { value: "yes", label: "Sí, me gusta explicar juegos" },
  { value: "sometimes", label: "A veces" },
  { value: "prefer_learn", label: "Prefiero que me enseñen" },
] as const;

export interface FavoriteGame {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export interface KlefferProfileData {
  attends_alone: string | null;
  scheduled_games: string | null;
  goals: string[];
  favorite_games: FavoriteGame[];
  game_types: string[];
  experience_level: string | null;
  availability: string[];
  languages: string[];
  teaches: string | null;
  bio: string | null;
  is_public: boolean;
}

export const EMPTY_KLEFFER_PROFILE: KlefferProfileData = {
  attends_alone: null,
  scheduled_games: null,
  goals: [],
  favorite_games: [],
  game_types: [],
  experience_level: null,
  availability: [],
  languages: [],
  teaches: null,
  bio: null,
  is_public: true,
};

/** Porcentaje de completitud del perfil de kleffer (0-100). */
export function klefferProfileCompletion(p: KlefferProfileData | null): number {
  if (!p) return 0;
  const checks = [
    !!p.attends_alone,
    !!p.scheduled_games,
    p.goals.length > 0,
    p.favorite_games.length > 0,
    p.game_types.length > 0,
    !!p.experience_level,
    p.availability.length > 0,
    p.languages.length > 0,
    !!p.teaches,
    !!p.bio && p.bio.trim().length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function labelOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export function labelsOf(
  options: ReadonlyArray<{ value: string; label: string }>,
  values: string[] | null | undefined,
): string[] {
  return (values ?? []).map((v) => options.find((o) => o.value === v)?.label ?? v);
}

/** Localized option labels, keyed by option value, for each app locale. */
const OPTION_TRANSLATIONS: Record<
  "attendsAlone" | "scheduledGames" | "goals" | "gameTypes" | "experience" | "availability" | "languages" | "teaches",
  Record<string, Record<AppLocale, string>>
> = {
  attendsAlone: {
    alone: { es: "Suelo venir solo/a", ca: "Sol vinc sol/a", en: "I usually come alone" },
    with_friends: { es: "Suelo venir con amigos", ca: "Sol vinc amb amics", en: "I usually come with friends" },
    depends: { es: "Depende del día", ca: "Depèn del dia", en: "Depends on the day" },
  },
  scheduledGames: {
    yes: {
      es: "Sí, me apunto a partidas programadas",
      ca: "Sí, m'apunto a partides programades",
      en: "Yes, I sign up for scheduled games",
    },
    improvise: {
      es: "Prefiero improvisar al llegar",
      ca: "Prefereixo improvisar en arribar",
      en: "I prefer to improvise on arrival",
    },
    depends: { es: "Según el juego", ca: "Depèn del joc", en: "Depends on the game" },
  },
  goals: {
    friends: { es: "Hacer nuevas amistades", ca: "Fer noves amistats", en: "Make new friends" },
    play: { es: "Jugar mucho", ca: "Jugar molt", en: "Play a lot" },
    community: { es: "Participar en la comunidad", ca: "Participar en la comunitat", en: "Join the community" },
    organize: { es: "Organizar partidas", ca: "Organitzar partides", en: "Organise games" },
    compete: { es: "Competir en torneos", ca: "Competir en torneigs", en: "Compete in tournaments" },
    discover: { es: "Descubrir novedades", ca: "Descobrir novetats", en: "Discover new releases" },
  },
  gameTypes: {
    euro: { es: "Eurogames", ca: "Eurogames", en: "Eurogames" },
    party: { es: "Party", ca: "Party", en: "Party" },
    hidden_roles: { es: "Roles ocultos", ca: "Rols ocults", en: "Hidden roles" },
    coop: { es: "Cooperativos", ca: "Cooperatius", en: "Cooperative" },
    wargames: { es: "Wargames", ca: "Wargames", en: "Wargames" },
    family: { es: "Familiares", ca: "Familiars", en: "Family" },
    deduction: { es: "Deducción", ca: "Deducció", en: "Deduction" },
    abstract: { es: "Abstractos", ca: "Abstractes", en: "Abstract" },
    rpg: { es: "Rol / narrativos", ca: "Rol / narratius", en: "RPG / narrative" },
  },
  experience: {
    novice: { es: "Novato/a", ca: "Novell/a", en: "Beginner" },
    regular: { es: "Habitual", ca: "Habitual", en: "Regular" },
    veteran: { es: "Veterano/a", ca: "Veterà/na", en: "Veteran" },
  },
  availability: {
    weekday_afternoon: { es: "Entre semana, tarde", ca: "Entre setmana, tarda", en: "Weekday, afternoon" },
    weekday_evening: { es: "Entre semana, noche", ca: "Entre setmana, vespre", en: "Weekday, evening" },
    friday_evening: { es: "Viernes noche", ca: "Divendres vespre", en: "Friday evening" },
    saturday_morning: { es: "Sábado mañana", ca: "Dissabte matí", en: "Saturday morning" },
    saturday_afternoon: { es: "Sábado tarde", ca: "Dissabte tarda", en: "Saturday afternoon" },
    saturday_evening: { es: "Sábado noche", ca: "Dissabte vespre", en: "Saturday evening" },
    sunday: { es: "Domingo", ca: "Diumenge", en: "Sunday" },
  },
  languages: {
    ca: { es: "Català", ca: "Català", en: "Catalan" },
    es: { es: "Castellano", ca: "Castellà", en: "Spanish" },
    en: { es: "English", ca: "English", en: "English" },
    other: { es: "Otro", ca: "Altre", en: "Other" },
  },
  teaches: {
    yes: {
      es: "Sí, me gusta explicar juegos",
      ca: "Sí, m'agrada explicar jocs",
      en: "Yes, I like to teach games",
    },
    sometimes: { es: "A veces", ca: "De vegades", en: "Sometimes" },
    prefer_learn: {
      es: "Prefiero que me enseñen",
      ca: "Prefereixo que m'ensenyin",
      en: "I prefer to be taught",
    },
  },
};

/** Localize an options list (value/label pairs) for display, keeping stored values unchanged. */
export function localizeOptions(
  key: keyof typeof OPTION_TRANSLATIONS,
  options: ReadonlyArray<{ value: string; label: string }>,
  locale: AppLocale,
): Array<{ value: string; label: string }> {
  const table = OPTION_TRANSLATIONS[key];
  return options.map((o) => ({ value: o.value, label: table[o.value]?.[locale] ?? o.label }));
}
