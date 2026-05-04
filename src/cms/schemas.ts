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

// ---------------- BLOOD ON THE CLOCKTOWER ----------------

const clocktowerSchema: PageSchema = {
  key: "clocktower",
  label: "Blood on the Clocktower",
  path: "/clocktower",
  description:
    "Página dedicada a la comunidad de Blood on the Clocktower de KLEFF: descripción del juego, reel de Instagram, localizaciones donde se juega y enlace al grupo de WhatsApp.",
  sections: [
    {
      key: "clocktower.hero",
      label: "Hero (cabecera)",
      description: "Cabecera principal con eyebrow, título, subtítulo y CTA al grupo de WhatsApp.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior", placeholder: "Comunidad activa · Partidas semanales" },
        title: { kind: "text", label: "Título principal" },
        subtitle: { kind: "textarea", label: "Subtítulo / intro", rows: 3 },
        whatsappLabel: { kind: "text", label: "Texto del botón de WhatsApp" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo de WhatsApp" },
        heroImage: { kind: "image", label: "Imagen de cabecera (ambiente)" },
      },
      defaults: {
        eyebrow: "Comunidad activa · Partidas semanales",
        title: "Blood on the Clocktower en KLEFF",
        subtitle:
          "Una comunidad activa que se reúne cada semana para jugar al juego de deducción social más adictivo de los últimos años. En cada noche organizamos hasta 3 partidas simultáneas con diferentes niveles, para que tanto si es tu primera vez como si ya eres un veterano encuentres tu sitio.",
        whatsappLabel: "Únete al grupo de WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/CrNuzqf2ly5JMDCnxdJq6E",
        heroImage: "",
      },
    },
    {
      key: "clocktower.about",
      label: "¿Qué es Blood on the Clocktower?",
      description: "Bloque de descripción del juego, con título, párrafos largos y enlace a la web oficial.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título de la sección" },
        body: { kind: "textarea", label: "Descripción (puedes usar varios párrafos)", rows: 8 },
        officialLabel: { kind: "text", label: "Texto del enlace a la web oficial" },
        officialUrl: { kind: "url", label: "URL oficial del juego" },
      },
      defaults: {
        eyebrow: "El juego",
        title: "Un pueblo, un asesino y una torre que no para nunca.",
        body:
          "Blood on the Clocktower es un juego de deducción social para 5 a 20 jugadores. Cada partida transcurre en el pueblo ficticio de Ravenswood Bluff, donde un Demonio se esconde entre los habitantes y mata cada noche a uno de los aldeanos. El equipo del Bien debe descubrir quién es el Demonio antes de que sea demasiado tarde; el equipo del Mal hará todo lo posible por impedirlo: mentir, manipular y sembrar la confusión.\n\nLo especial de Clocktower es que ningún jugador queda eliminado: aunque mueras, sigues participando, votando y ayudando a tu bando. Cada personaje tiene una habilidad única que cambia por completo el flujo de la partida, así que dos partidas nunca son iguales. Hay un Narrador (el Storyteller) que dirige el juego y mantiene los secretos.\n\nEs un juego pensado para hablar, observar y sospechar. Se aprende rapidísimo, pero la profundidad estratégica es enorme: por eso engancha tanto y por eso ya tenemos una comunidad fija que repite cada semana.",
        officialLabel: "Web oficial del juego",
        officialUrl: "https://bloodontheclocktower.com/",
      },
    },
    {
      key: "clocktower.reel",
      label: "Reel de Instagram",
      description: "Vídeo embebido de Instagram para mostrar el ambiente de las partidas.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        reelUrl: {
          kind: "url",
          label: "URL del reel de Instagram",
          placeholder: "https://www.instagram.com/reel/…/",
        },
      },
      defaults: {
        eyebrow: "El ambiente",
        title: "Así se vive una noche de Clocktower",
        subtitle: "Mira el reel y entenderás por qué la gente se engancha desde la primera partida.",
        reelUrl: "https://www.instagram.com/reel/DLKwPSCo72N/",
      },
    },
    {
      key: "clocktower.locations",
      label: "Localizaciones",
      description:
        "Sitios donde se juega a Clocktower. Para cada uno puedes editar nombre, frecuencia, idiomas, niveles y hasta tres imágenes de galería.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título de la sección" },
        intro: { kind: "textarea", label: "Texto introductorio", rows: 2 },
        items: {
          kind: "list",
          label: "Localizaciones",
          itemLabel: "Localización",
          fields: {
            name: { kind: "text", label: "Nombre de la localización" },
            frequency: { kind: "text", label: "Frecuencia (ej: Partidas semanales)" },
            tables: { kind: "text", label: "Mesas / formato (ej: 3 partidas simultáneas)" },
            languages: { kind: "text", label: "Idiomas (ej: Castellano e inglés)" },
            levels: { kind: "text", label: "Niveles (ej: Principiante, intermedio y avanzado)" },
            description: { kind: "textarea", label: "Descripción opcional", rows: 3 },
            image1: { kind: "image", label: "Imagen 1" },
            image2: { kind: "image", label: "Imagen 2" },
            image3: { kind: "image", label: "Imagen 3" },
          },
        },
      },
      defaults: {
        eyebrow: "Dónde jugamos",
        title: "Dos sedes, una misma comunidad.",
        intro:
          "Cada localización tiene su carácter, su frecuencia y su nivel. Elige la que mejor te encaje y nos vemos en la mesa.",
        items: [
          {
            name: "L'Estació · Espai Gastronòmic",
            frequency: "Partidas semanales",
            tables: "3 partidas simultáneas",
            languages: "Castellano e inglés",
            levels: "Principiante, intermedio y avanzado",
            description:
              "Nuestra sede principal. Cada semana montamos tres mesas en paralelo para que cualquiera pueda venir, sea su primera partida o la número cien.",
            image1: "",
            image2: "",
            image3: "",
          },
          {
            name: "El Convento",
            frequency: "Partidas esporádicas",
            tables: "",
            languages: "Castellano",
            levels: "Intermedio y avanzado",
            description:
              "Sesiones especiales en un entorno único. Pensadas para jugadores con experiencia que buscan partidas más largas y atmosféricas.",
            image1: "",
            image2: "",
            image3: "",
          },
        ],
      },
    },
    {
      key: "clocktower.cta",
      label: "CTA final · Únete",
      description: "Bloque final con llamada a unirse al grupo de WhatsApp.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        whatsappLabel: { kind: "text", label: "Texto del botón" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo" },
      },
      defaults: {
        eyebrow: "Únete",
        title: "¿Listo para jugar?",
        subtitle:
          "Entra al grupo de WhatsApp para enterarte de la próxima partida, apuntarte y conocer al resto de la comunidad.",
        whatsappLabel: "Unirme al WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/CrNuzqf2ly5JMDCnxdJq6E",
      },
    },
  ],
};

// ---------------- ABOUT ----------------

const aboutSchema: PageSchema = {
  key: "about",
  label: "Quiénes somos",
  path: "/sobre-nosotros",
  description: "Página About: hero, misión, manifiesto y CTA final. El equipo y el timeline se gestionan en código.",
  sections: [
    {
      key: "about.hero",
      label: "Hero (cabecera)",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título principal" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
        image: { kind: "image", label: "Imagen lateral" },
      },
      defaults: { eyebrow: "", title: "", intro: "", image: "" },
    },
    {
      key: "about.mission",
      label: "Misión",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Texto", rows: 5 },
        cta: { kind: "text", label: "Línea final destacada" },
      },
      defaults: { eyebrow: "", title: "", body: "", cta: "" },
    },
    {
      key: "about.manifesto",
      label: "Manifiesto",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        line1: { kind: "text", label: "Frase 1" },
        line2: { kind: "text", label: "Frase 2 (cursiva)" },
        author: { kind: "text", label: "Autor" },
      },
      defaults: { eyebrow: "", line1: "", line2: "", author: "" },
    },
    {
      key: "about.cta",
      label: "CTA final",
      fields: {
        title: { kind: "text", label: "Título" },
      },
      defaults: { title: "" },
    },
  ],
};

// ---------------- HOW IT WORKS ----------------

const howSchema: PageSchema = {
  key: "how",
  label: "Cómo funciona",
  path: "/como-funciona",
  description: "Página de cómo funciona KLEFF. Las listas largas de actividades, beneficios y comunidades se gestionan desde el código.",
  sections: [
    {
      key: "how.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 4 },
      },
      defaults: { eyebrow: "", title: "", intro: "" },
    },
    {
      key: "how.steps",
      label: "Cómo funciona — encabezado",
      fields: {
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Cuerpo", rows: 3 },
      },
      defaults: { title: "", body: "" },
    },
    {
      key: "how.activities",
      label: "Actividades — encabezado",
      fields: {
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
      },
      defaults: { title: "", subtitle: "" },
    },
    {
      key: "how.communities",
      label: "Comunidades — encabezado",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
      },
      defaults: { eyebrow: "", title: "", intro: "" },
    },
    {
      key: "how.member",
      label: "Hazte socio",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        ctaTitle: { kind: "text", label: "CTA — título" },
        ctaBody: { kind: "textarea", label: "CTA — cuerpo", rows: 3 },
        ctaLabel: { kind: "text", label: "CTA — botón" },
      },
      defaults: { eyebrow: "", title: "", subtitle: "", ctaTitle: "", ctaBody: "", ctaLabel: "" },
    },
  ],
};

// ---------------- CONTACT ----------------

const contactSchema: PageSchema = {
  key: "contact",
  label: "Contacto",
  path: "/contacto",
  sections: [
    {
      key: "contact.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 3 },
      },
      defaults: { eyebrow: "", title: "", subtitle: "" },
    },
    {
      key: "contact.info",
      label: "Datos de contacto",
      fields: {
        email: { kind: "text", label: "Email" },
        phone: { kind: "text", label: "Teléfono" },
        instagram: { kind: "text", label: "Instagram (handle)" },
        instagramUrl: { kind: "url", label: "Instagram URL" },
        address: { kind: "textarea", label: "Dirección", rows: 2 },
      },
      defaults: {
        email: "hola@kleff.es",
        phone: "605 355 109",
        instagram: "@kleff.bcn",
        instagramUrl: "https://www.instagram.com/kleff.bcn/",
        address: "L'Estació Espai Gastronòmic · Av. Marquès de l'Argentera 6-8, Barcelona",
      },
    },
  ],
};

// ---------------- MEDIA ----------------

const mediaSchema: PageSchema = {
  key: "media",
  label: "Media",
  path: "/medios",
  description: "Página de medios. La lista de apariciones de prensa se gestiona desde el panel de Media.",
  sections: [
    {
      key: "media.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
      },
      defaults: { eyebrow: "", title: "", intro: "" },
    },
    {
      key: "media.instagram",
      label: "Bloque Instagram",
      fields: {
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 3 },
        ctaLabel: { kind: "text", label: "Texto del botón" },
      },
      defaults: { title: "", subtitle: "", ctaLabel: "" },
    },
  ],
};

// ---------------- BLOG ----------------

const blogSchema: PageSchema = {
  key: "blog",
  label: "Blog",
  path: "/blog",
  sections: [
    {
      key: "blog.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Cuerpo", rows: 4 },
      },
      defaults: { eyebrow: "", title: "", body: "" },
    },
  ],
};

// ---------------- LUDOTECA ----------------

const ludotecaSchema: PageSchema = {
  key: "ludoteca",
  label: "Ludoteca",
  path: "/ludoteca",
  description: "Página de la ludoteca. La colección de juegos se sincroniza con BGG.",
  sections: [
    {
      key: "ludoteca.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
      },
      defaults: { eyebrow: "", title: "", intro: "" },
    },
  ],
};

// ---------------- REGISTRY ----------------

export const PAGE_SCHEMAS: PageSchema[] = [
  homeSchema,
  clocktowerSchema,
  aboutSchema,
  howSchema,
  contactSchema,
  mediaSchema,
  blogSchema,
  ludotecaSchema,
];

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
