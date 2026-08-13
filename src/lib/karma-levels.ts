export type KarmaLevel = {
  key: string;
  name: string;
  name_ca: string;
  name_en: string;
  min: number;
  max: number | null;
  perk: string;
  perk_ca: string;
  perk_en: string;
};

export const KARMA_LEVELS: KarmaLevel[] = [
  {
    key: "aprendiz",
    name: "Aprendiz de mesa",
    name_ca: "Aprenent de taula",
    name_en: "Board apprentice",
    min: 0,
    max: 49,
    perk: "—",
    perk_ca: "—",
    perk_en: "—",
  },
  {
    key: "estratega",
    name: "Estratega KLEFF",
    name_ca: "Estrateg KLEFF",
    name_en: "KLEFF strategist",
    min: 50,
    max: 149,
    perk: "Insignia en el perfil y el carnet",
    perk_ca: "Insígnia al perfil i al carnet",
    perk_en: "Badge on profile and membership card",
  },
  {
    key: "maestro",
    name: "Maestro del Tablero",
    name_ca: "Mestre del Tauler",
    name_en: "Board master",
    min: 150,
    max: 299,
    perk: "Insignia + mención en perfiles",
    perk_ca: "Insígnia + menció als perfils",
    perk_en: "Badge + mention on profiles",
  },
  {
    key: "leyenda",
    name: "Leyenda de KLEFF",
    name_ca: "Llegenda de KLEFF",
    name_en: "KLEFF legend",
    min: 300,
    max: null,
    perk: "Insignia + regalo simbólico anual",
    perk_ca: "Insígnia + regal simbòlic anual",
    perk_en: "Badge + symbolic yearly gift",
  },
];

export function levelForKarma(lifetime: number): KarmaLevel {
  return (
    [...KARMA_LEVELS].reverse().find((l) => lifetime >= l.min) ?? KARMA_LEVELS[0]
  );
}

export function nextLevelForKarma(lifetime: number): KarmaLevel | null {
  return KARMA_LEVELS.find((l) => l.min > lifetime) ?? null;
}

export const KARMA_GROUP_LABELS: Record<string, string> = {
  ludoteca: "Ludoteca",
  difusion: "Difusión",
  referidos: "Referidos",
  participacion: "Participación en eventos",
  organizacion: "Apoyo en organización",
  otras: "Otras contribuciones",
};

export const KARMA_ENTRY_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  voided: "Anulada",
};

export const KARMA_REDEMPTION_STATUS_LABELS: Record<string, string> = {
  requested: "Solicitado",
  approved: "Aprobado",
  delivered: "Entregado",
  rejected: "Rechazado",
};

export const KARMA_EFFECT_LABELS: Record<string, string> = {
  manual: "Entrega manual",
  fee_discount: "Descuento de cuota",
  raffle_ticket: "Papeleta de sorteo",
  extra_rental: "Préstamo adicional",
  extend_rental: "Ampliación de plazo",
  tournament_discount: "Descuento en torneo",
  priority_access: "Acceso prioritario",
  double_vote: "Voto doble",
};
