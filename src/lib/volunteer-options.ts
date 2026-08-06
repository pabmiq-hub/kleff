export const VOLUNTEER_AREAS = [
  "Organización de eventos",
  "Dinamización de partidas",
  "Enseñar juegos (explicar reglas)",
  "Torneos y competiciones",
  "Comunicación y redes sociales",
  "Fotografía y vídeo",
  "Diseño gráfico",
  "Web y tecnología",
  "Ludoteca y catálogo",
  "Acogida de nuevos socios",
  "Búsqueda de sedes y colaboraciones",
  "Patrocinios y comercial",
  "Otro",
] as const;

export const VOLUNTEER_EVENT_CATEGORIES = [
  "Noches de juegos",
  "Blood on the Clocktower / roles ocultos",
  "Catan",
  "Torneos",
  "Slow Friending Lúdico",
  "Eventos familiares",
  "Jornadas y ferias",
  "Eventos con empresas",
] as const;

export const VOLUNTEER_EVENT_ROLES = [
  "Montaje",
  "Recepción y cobro",
  "Acomodar a los asistentes",
  "Demostrar y explicar juegos",
  "Desmontaje",
  "Otro",
] as const;

export const VOLUNTEER_BENEFITS = [
  "Karma extra",
  "Entrada gratuita a eventos",
  "Descuento en la cuota de socio",
  "Préstamos de juegos ampliados",
  "Merchandising KLEFF",
  "Formación en dinamización",
  "Networking con la organización",
  "Ninguno, colaboro por gusto",
] as const;

export const VOLUNTEER_LANGUAGES = ["Català", "Castellano", "English", "Otro"] as const;

export const VOLUNTEER_INSTITUTIONAL = [
  "RRHH (personas y voluntariado)",
  "Marketing & Comercial",
  "Solo eventos",
] as const;

export const VOLUNTEER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  reviewing: "En revisión",
  accepted: "Aceptada",
  declined: "Descartada",
};

export type VolunteerAnswers = {
  areas: string[];
  eventCategories: string[];
  eventRoles: string[];
  benefits: string[];
  languages: string[];
  institutional: string[];
  availability: string;
  duesOpinion: "yes" | "no" | "";
  duesAmount: string;
  duesBenefits: string;
  comments: string;
};

export const EMPTY_VOLUNTEER_ANSWERS: VolunteerAnswers = {
  areas: [],
  eventCategories: [],
  eventRoles: [],
  benefits: [],
  languages: [],
  institutional: [],
  availability: "",
  duesOpinion: "",
  duesAmount: "",
  duesBenefits: "",
  comments: "",
};
