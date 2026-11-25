import { z } from "zod";

export type HitsterSide = "A" | "B";
export type HitsterLang = "es" | "ca" | "en";
export type HitsterColor = "green" | "pink" | "yellow" | "purple" | "blue";
export type HitsterStatus = "draft" | "playing" | "tiebreak" | "finished";
export type HitsterRoundPhase = "answering" | "validating" | "closed";

export const HITSTER_COLORS: readonly HitsterColor[] = ["green", "pink", "yellow", "purple", "blue"] as const;

export interface HitsterCategoryDef {
  color: HitsterColor;
  allowExactBonus: boolean;
  name: Record<HitsterLang, string>;
  description: Record<HitsterLang, string>;
  placeholder: Record<HitsterLang, string>;
}

export const HITSTER_CATEGORIES: Record<HitsterSide, Record<HitsterColor, HitsterCategoryDef>> = {
  A: {
    green: {
      color: "green",
      allowExactBonus: false,
      name: { es: "Grupo o solista", ca: "Grup o solista", en: "Group or solo artist" },
      description: {
        es: "Escribe si la canción la interpreta un solista o un grupo. Las colaboraciones especiales, así como dúos, cuentan como grupos.",
        ca: "Escriu si la cançó la interpreta un solista o un grup. Les col·laboracions especials, així com duets, compten com a grups.",
        en: "Write whether the song is performed by a solo artist or a group. Special collaborations and duos count as groups.",
      },
      placeholder: { es: "Ej. Grupo / Solista", ca: "Ex. Grup / Solista", en: "e.g. Group / Solo" },
    },
    pink: {
      color: "pink",
      allowExactBonus: false,
      name: { es: "¿Antes del 2000?", ca: "Abans del 2000?", en: "Before 2000?" },
      description: {
        es: "Escribe «Sí» si la canción se publicó antes del año 2000 y «No» si fue en el año 2000 o más tarde.",
        ca: "Escriu «Sí» si la cançó es va publicar abans de l'any 2000 i «No» si va ser l'any 2000 o més tard.",
        en: "Write \"Yes\" if the song was released before the year 2000 and \"No\" if it was released in 2000 or later.",
      },
      placeholder: { es: "Sí / No", ca: "Sí / No", en: "Yes / No" },
    },
    yellow: {
      color: "yellow",
      allowExactBonus: true,
      name: { es: "4 años arriba o abajo", ca: "4 anys amunt o avall", en: "Within 4 years" },
      description: {
        es: "Escribe el año en el que se publicó la canción. Anótate un punto si tu respuesta está dentro de un intervalo de 4 años respecto al año real. Si adivinas el año exacto, te da derecho a eliminar una cruz del cartón de un adversario.",
        ca: "Escriu l'any en què es va publicar la cançó. Anota't un punt si la teva resposta és dins d'un interval de 4 anys respecte a l'any real. Si endevines l'any exacte, tens dret a eliminar una creu del cartró d'un adversari.",
        en: "Write the year the song was released. Score a point if your answer is within 4 years of the actual year. If you guess the exact year, you may remove a cross from an opponent's board.",
      },
      placeholder: { es: "Ej. 1994", ca: "Ex. 1994", en: "e.g. 1994" },
    },
    purple: {
      color: "purple",
      allowExactBonus: false,
      name: { es: "Década", ca: "Dècada", en: "Decade" },
      description: {
        es: "Escribe la década en la que se publicó la canción; por ejemplo, «1960» o «los ochenta».",
        ca: "Escriu la dècada en què es va publicar la cançó; per exemple, «1960» o «els vuitanta».",
        en: "Write the decade the song was released; for example, \"1960s\" or \"the eighties\".",
      },
      placeholder: { es: "Ej. 1980 / los ochenta", ca: "Ex. 1980 / els vuitanta", en: "e.g. 1980s" },
    },
    blue: {
      color: "blue",
      allowExactBonus: true,
      name: { es: "2 años arriba o abajo", ca: "2 anys amunt o avall", en: "Within 2 years" },
      description: {
        es: "Escribe el año en el que se publicó la canción. Anótate un punto si tu respuesta está dentro de un intervalo de 2 años respecto al año real. Si adivinas el año exacto, te da derecho a eliminar una cruz del cartón de un adversario.",
        ca: "Escriu l'any en què es va publicar la cançó. Anota't un punt si la teva resposta és dins d'un interval de 2 anys respecte a l'any real. Si endevines l'any exacte, tens dret a eliminar una creu del cartró d'un adversari.",
        en: "Write the year the song was released. Score a point if your answer is within 2 years of the actual year. If you guess the exact year, you may remove a cross from an opponent's board.",
      },
      placeholder: { es: "Ej. 2008", ca: "Ex. 2008", en: "e.g. 2008" },
    },
  },
  B: {
    green: {
      color: "green",
      allowExactBonus: false,
      name: { es: "Título de la canción", ca: "Títol de la cançó", en: "Song title" },
      description: {
        es: "Escribe el título de la canción. Si lo que has escrito es casi correcto pero no del todo, los demás jugadores deciden si puedes anotarte un punto.",
        ca: "Escriu el títol de la cançó. Si el que has escrit és gairebé correcte però no del tot, la resta de jugadors decideixen si pots anotar-te un punt.",
        en: "Write the title of the song. If what you wrote is almost right but not quite, the other players decide whether you score a point.",
      },
      placeholder: { es: "Título de la canción", ca: "Títol de la cançó", en: "Song title" },
    },
    pink: {
      color: "pink",
      allowExactBonus: false,
      name: { es: "Año exacto", ca: "Any exacte", en: "Exact year" },
      description: {
        es: "Escribe el año en el que se publicó la canción. Anótate un punto si aciertas. Nota: La fecha que figura en cada tarjeta corresponde al año en el que se publicó la canción o al año en el que el artista original interpretó la canción en público por primera vez.",
        ca: "Escriu l'any en què es va publicar la cançó. Anota't un punt si l'encertes. Nota: La data de cada targeta correspon a l'any de publicació o a l'any en què l'artista original la va interpretar en públic per primera vegada.",
        en: "Write the year the song was released. Score a point if you get it right. Note: The date on each card is the release year or the year the original artist first performed the song publicly.",
      },
      placeholder: { es: "Ej. 1999", ca: "Ex. 1999", en: "e.g. 1999" },
    },
    yellow: {
      color: "yellow",
      allowExactBonus: false,
      name: { es: "Nombre del grupo o cantante", ca: "Nom del grup o cantant", en: "Artist or band name" },
      description: {
        es: "¡Escríbelo! Cuando se trate de colaboraciones, el nombre del solista principal se aceptará como correcto.",
        ca: "Escriu-lo! Quan es tracti de col·laboracions, el nom del solista principal s'acceptarà com a correcte.",
        en: "Write it down! For collaborations, the name of the lead artist counts as correct.",
      },
      placeholder: { es: "Artista o banda", ca: "Artista o banda", en: "Artist or band" },
    },
    purple: {
      color: "purple",
      allowExactBonus: false,
      name: { es: "Década", ca: "Dècada", en: "Decade" },
      description: {
        es: "Escribe la década en la que se publicó la canción; por ejemplo, «1960» o «los ochenta».",
        ca: "Escriu la dècada en què es va publicar la cançó; per exemple, «1960» o «els vuitanta».",
        en: "Write the decade the song was released; for example, \"1960s\" or \"the eighties\".",
      },
      placeholder: { es: "Ej. 1980 / los ochenta", ca: "Ex. 1980 / els vuitanta", en: "e.g. 1980s" },
    },
    blue: {
      color: "blue",
      allowExactBonus: false,
      name: { es: "3 años arriba o abajo", ca: "3 anys amunt o avall", en: "Within 3 years" },
      description: {
        es: "Escribe el año en el que se publicó la canción. Anótate un punto si tu respuesta está dentro de un intervalo de 3 años respecto al año real.",
        ca: "Escriu l'any en què es va publicar la cançó. Anota't un punt si la teva resposta és dins d'un interval de 3 anys respecte a l'any real.",
        en: "Write the year the song was released. Score a point if your answer is within 3 years of the actual year.",
      },
      placeholder: { es: "Ej. 2012", ca: "Ex. 2012", en: "e.g. 2012" },
    },
  },
};

export const HITSTER_COLOR_STYLES: Record<HitsterColor, { bg: string; soft: string; border: string; text: string; ring: string; hex: string }> = {
  green: { bg: "bg-emerald-500", soft: "bg-emerald-500/15", border: "border-emerald-500", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-400", hex: "#10b981" },
  pink: { bg: "bg-pink-500", soft: "bg-pink-500/15", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300", ring: "ring-pink-400", hex: "#ec4899" },
  yellow: { bg: "bg-amber-400", soft: "bg-amber-400/20", border: "border-amber-500", text: "text-amber-800 dark:text-amber-300", ring: "ring-amber-400", hex: "#f59e0b" },
  purple: { bg: "bg-violet-500", soft: "bg-violet-500/15", border: "border-violet-500", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-400", hex: "#8b5cf6" },
  blue: { bg: "bg-sky-500", soft: "bg-sky-500/15", border: "border-sky-500", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-400", hex: "#0ea5e9" },
};

export const hitsterSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "El enlace debe tener 3-50 caracteres (letras, números y guiones).");

export function normalizeHitsterSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function nicknameKey(name: string): string {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeAccessCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

export function isAvatarDataUrl(v: string): boolean {
  return /^data:image\/(svg\+xml|png|jpeg|webp);(utf8,|base64,)/.test(v) && v.length <= 220_000;
}

/** Generates a balanced 5x5 board with exactly 5 cells of each of the 5 colors. */
export function generateBoard(rng: () => number = Math.random): HitsterColor[] {
  const cells: HitsterColor[] = [];
  for (const c of HITSTER_COLORS) {
    for (let i = 0; i < 5; i++) cells.push(c);
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cells[i]!;
    cells[i] = cells[j]!;
    cells[j] = tmp;
  }
  return cells;
}

export function emptyMarks(): boolean[] {
  return Array.from({ length: 25 }, () => false);
}

/** Checks rows and columns on a 5x5 grid. Returns the 5 winning cell indices or null. */
export function hasBingoLine(marks: readonly boolean[]): number[] | null {
  if (marks.length !== 25) return null;
  for (let r = 0; r < 5; r++) {
    const row = [r * 5, r * 5 + 1, r * 5 + 2, r * 5 + 3, r * 5 + 4];
    if (row.every((i) => marks[i] === true)) return row;
  }
  for (let c = 0; c < 5; c++) {
    const col = [c, c + 5, c + 10, c + 15, c + 20];
    if (col.every((i) => marks[i] === true)) return col;
  }
  return null;
}

export function pickRandomCategory(prev?: HitsterColor | null, rng: () => number = Math.random): HitsterColor {
  const pool = prev ? HITSTER_COLORS.filter((c) => c !== prev) : HITSTER_COLORS;
  return pool[Math.floor(rng() * pool.length)] ?? "green";
}

export interface OutcomeEvaluation {
  status: HitsterStatus;
  winnerIds: string[];
  tiebreakIds: string[];
}

/**
 * Evaluates victory or tiebreak after a round closes:
 * - In normal play ('playing'): first player with a complete row or column wins. If 2+ complete at the same time -> 'tiebreak'.
 * - In 'tiebreak': only tied players compete; the first tied player to get the next answer right ahead of the others wins.
 */
export function evaluateGameOutcome(params: {
  status: HitsterStatus;
  participants: readonly { id: string; marks: readonly boolean[] }[];
  tiebreakIds: readonly string[];
  roundCorrectIds: readonly string[];
}): OutcomeEvaluation {
  const { status, participants, tiebreakIds, roundCorrectIds } = params;
  if (status === "finished" || status === "draft") {
    return { status, winnerIds: [], tiebreakIds: [...tiebreakIds] };
  }

  if (status === "tiebreak") {
    const correctSet = new Set(roundCorrectIds);
    const leaders = tiebreakIds.filter((id) => correctSet.has(id));
    if (leaders.length === 1) {
      return { status: "finished", winnerIds: [leaders[0]!], tiebreakIds: [] };
    }
    if (leaders.length > 1) {
      return { status: "tiebreak", winnerIds: [], tiebreakIds: leaders };
    }
    return { status: "tiebreak", winnerIds: [], tiebreakIds: [...tiebreakIds] };
  }

  const lined = participants.filter((p) => hasBingoLine(p.marks) !== null).map((p) => p.id);
  if (lined.length === 1) {
    return { status: "finished", winnerIds: [lined[0]!], tiebreakIds: [] };
  }
  if (lined.length > 1) {
    return { status: "tiebreak", winnerIds: [], tiebreakIds: lined };
  }
  return { status: "playing", winnerIds: [], tiebreakIds: [] };
}