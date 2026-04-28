// Editable content schemas. Each section of each page declares which fields the
// admin can edit and provides the default values rendered when the DB has no
// row yet. Fields are typed so the editor can auto-generate the right input.

export type FieldType =
  | { kind: "text"; label: string; placeholder?: string }
  | { kind: "textarea"; label: string; placeholder?: string; rows?: number }
  | { kind: "image"; label: string; help?: string }
  | { kind: "url"; label: string; placeholder?: string }
  | {
      kind: "list";
      label: string;
      itemLabel: string;
      fields: Record<string, FieldType>;
    };

export type SectionSchema = {
  key: string;
  label: string;
  description?: string;
  fields: Record<string, FieldType>;
  defaults: Record<string, unknown>;
};

export type PageSchema = {
  key: string;
  label: string;
  path: string;
  description?: string;
  sections: SectionSchema[];
};

// ---------------- HOME ----------------

const homeSchema: PageSchema = {
  key: "home",
  label: "Inicio",
  path: "/",
  description: "La página principal de la web.",
  sections: [
    {
      key: "home.hero",
      label: "Hero (cabecera)",
      description: "Sección superior con título grande, subtítulo y botones.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior", placeholder: "Game Nights cada miércoles" },
        titleA: { kind: "text", label: "Título — parte inicial" },
        titleHighlight: { kind: "text", label: "Título — palabra destacada" },
        titleB: { kind: "text", label: "Título — parte final" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 3 },
        ctaPrimary: { kind: "text", label: "Botón principal — texto" },
        ctaPrimaryHref: { kind: "url", label: "Botón principal — enlace" },
        ctaSecondary: { kind: "text", label: "Botón secundario — texto" },
        image: { kind: "image", label: "Imagen principal" },
      },
      defaults: {
        eyebrow: "",
        titleA: "",
        titleHighlight: "",
        titleB: "",
        subtitle: "",
        ctaPrimary: "",
        ctaPrimaryHref: "https://www.meetup.com/es-ES/kleff-bcn/events/?type=upcoming",
        ctaSecondary: "",
        image: "",
      },
    },
    {
      key: "home.pillars",
      label: "Pilares (3 columnas)",
      description: "Los tres bloques destacados bajo el hero.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título de la sección" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        pillar1Title: { kind: "text", label: "Pilar 1 — título" },
        pillar1Body: { kind: "textarea", label: "Pilar 1 — descripción", rows: 3 },
        pillar2Title: { kind: "text", label: "Pilar 2 — título" },
        pillar2Body: { kind: "textarea", label: "Pilar 2 — descripción", rows: 3 },
        pillar3Title: { kind: "text", label: "Pilar 3 — título" },
        pillar3Body: { kind: "textarea", label: "Pilar 3 — descripción", rows: 3 },
      },
      defaults: {
        eyebrow: "Por qué Kleff",
        title: "",
        subtitle: "",
        pillar1Title: "",
        pillar1Body: "",
        pillar2Title: "",
        pillar2Body: "",
        pillar3Title: "",
        pillar3Body: "",
      },
    },
    {
      key: "home.events",
      label: "Eventos (Meetup)",
      description: "Encabezado de la sección de próximos eventos. Los eventos se cargan en directo desde Meetup.",
      fields: {
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        ctaText: { kind: "text", label: "Texto del botón a Meetup" },
      },
      defaults: { title: "", subtitle: "", ctaText: "" },
    },
    {
      key: "home.testimonials",
      label: "Testimonios",
      description: "Cabecera y lista de testimonios mostrados en la home.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Testimonios",
          itemLabel: "Testimonio",
          fields: {
            quote: { kind: "textarea", label: "Cita", rows: 3 },
            author: { kind: "text", label: "Autor/a" },
            source: { kind: "text", label: "Fuente (Google / Meetup / …)" },
          },
        },
      },
      defaults: {
        eyebrow: "Lo que dicen",
        title: "",
        subtitle: "",
        items: [],
      },
    },
    {
      key: "home.reasons",
      label: "Razones para venir",
      description: "Sección final con imagen y lista de razones.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        image: { kind: "image", label: "Imagen lateral" },
        imageBadge: { kind: "text", label: "Etiqueta sobre la imagen" },
        items: {
          kind: "list",
          label: "Razones",
          itemLabel: "Razón",
          fields: {
            text: { kind: "text", label: "Texto (puede empezar con un emoji)" },
          },
        },
      },
      defaults: {
        eyebrow: "",
        title: "",
        image: "",
        imageBadge: "",
        items: [],
      },
    },
  ],
};

// ---------------- REGISTRY ----------------

export const PAGE_SCHEMAS: PageSchema[] = [homeSchema];

export function getPageSchema(key: string): PageSchema | undefined {
  return PAGE_SCHEMAS.find((p) => p.key === key);
}

export function getSectionSchema(sectionKey: string): SectionSchema | undefined {
  for (const p of PAGE_SCHEMAS) {
    const s = p.sections.find((s) => s.key === sectionKey);
    if (s) return s;
  }
  return undefined;
}

/**
 * Merges DB-stored content (possibly partial) on top of the schema defaults.
 * Always returns an object with every default field populated, so renderers
 * never have to deal with `undefined`.
 */
export function withDefaults(
  schema: SectionSchema,
  stored: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...schema.defaults };
  if (!stored) return out;
  for (const [k, v] of Object.entries(stored)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}
