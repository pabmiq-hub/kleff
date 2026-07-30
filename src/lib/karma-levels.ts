export type KarmaLevel = {
  key: string;
  name: string;
  min: number;
  max: number | null;
  perk: string;
};

export const KARMA_LEVELS: KarmaLevel[] = [
  { key: "aprendiz", name: "Aprendiz de mesa", min: 0, max: 49, perk: "—" },
  { key: "estratega", name: "Estratega KLEFF", min: 50, max: 149, perk: "Insignia en el perfil y el carnet" },
  { key: "maestro", name: "Maestro del Tablero", min: 150, max: 299, perk: "Insignia + mención en perfiles" },
  { key: "leyenda", name: "Leyenda de KLEFF", min: 300, max: null, perk: "Insignia + regalo simbólico anual" },
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
