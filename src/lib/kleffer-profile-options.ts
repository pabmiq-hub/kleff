/** Opciones compartidas del "perfil de kleffer" (cliente + servidor). */

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
