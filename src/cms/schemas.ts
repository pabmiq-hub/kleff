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
  path: "/blood-on-the-clocktower",
  description:
    "Página dedicada a la comunidad de Blood on the Clocktower de KLEFF: descripción del juego, reel de Instagram, localizaciones donde se juega y enlace al grupo de WhatsApp.",
  sections: [
    {
      key: "clocktower.hero",
      label: "Hero (cabecera)",
      description: "Cabecera principal con eyebrow, título, subtítulo y CTA al grupo de WhatsApp.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta (badge junto al WhatsApp)", placeholder: "Comunidad activa · Partidas semanales" },
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

// ---------------- CATAN ----------------

const catanSchema: PageSchema = {
  key: "catan",
  label: "Catan",
  path: "/catan",
  description:
    "Página dedicada a la comunidad de Catan: hero con WhatsApp, historia del juego, infografía visual de recursos y reglas, torneos.",
  sections: [
    {
      key: "catan.hero",
      label: "Hero (cabecera)",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título principal" },
        subtitle: { kind: "textarea", label: "Subtítulo / intro", rows: 3 },
        whatsappLabel: { kind: "text", label: "Texto del botón de WhatsApp" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo de WhatsApp" },
        stat1Label: { kind: "text", label: "Estadística 1 — etiqueta" },
        stat2Label: { kind: "text", label: "Estadística 2 — etiqueta" },
        stat3Label: { kind: "text", label: "Estadística 3 — etiqueta" },
      },
      defaults: {
        eyebrow: "Comunidad Catan · Tornejos cada mes",
        title: "Catan en KLEFF",
        subtitle:
          "Una de las comunidades más grandes y activas del local: más de 250 miembros, torneos cada mes y partidas constantes. Da igual si eres principiante o veterano: en Catan siempre hay sitio para una colonia más.",
        whatsappLabel: "Únete al grupo de WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/FbVhgyrIZXBJPrxC0DqoCE",
        stat1Label: "Miembros",
        stat2Label: "Torneos/año",
        stat3Label: "Partidas",
      },
    },
    {
      key: "catan.history",
      label: "Historia de Catan",
      description: "Hitos en la historia del juego (basado en Devirpedia).",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título de la sección" },
        sourceLabel: { kind: "text", label: "Texto del enlace a la fuente" },
        sourceUrl: { kind: "url", label: "URL de la fuente" },
        items: {
          kind: "list",
          label: "Hitos",
          itemLabel: "Hito",
          fields: {
            year: { kind: "text", label: "Año" },
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Descripción", rows: 4 },
          },
        },
      },
      defaults: {
        eyebrow: "La historia",
        title: "El juego que cambió la mesa moderna.",
        sourceLabel: "Fuente: Devirpedia",
        sourceUrl: "https://devir.es/devirpedia/catan",
        items: [
          {
            year: "1995",
            title: "Nace Die Siedler von Catan",
            body: "Klaus Teuber publica «Los Colonos de Catán» en Alemania. La fórmula —construir, comerciar, expandirse en una isla modular— revoluciona los juegos de mesa modernos y abre la puerta a los «eurogames».",
          },
          {
            year: "1996",
            title: "Spiel des Jahres",
            body: "Catan gana el premio más prestigioso del sector y se convierte en el primer fenómeno global del board gaming moderno. Empiezan a aparecer expansiones que multiplican las posibilidades.",
          },
          {
            year: "2000s",
            title: "Una saga inacabable",
            body: "Llegan «Marineros», «Ciudades y Caballeros», «Bárbaros y Comerciantes»… y versiones para 2 jugadores, infantil, en cartas, en versión histórica y hasta en el espacio. Catan es ya un universo.",
          },
          {
            year: "Hoy",
            title: "Más de 40 millones de copias",
            body: "Traducido a más de 40 idiomas y con torneos oficiales en todo el mundo. En España, Devir lo distribuye y mantiene viva la comunidad. En KLEFF, lo jugamos cada semana.",
          },
        ],
      },
    },
    {
      key: "catan.infographic",
      label: "Infografía: cómo funciona",
      description: "Recursos del juego y reglas básicas en formato visual.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        resourcesTitle: { kind: "text", label: "Título del bloque de recursos" },
        resource1Label: { kind: "text", label: "Recurso 1 — nombre" },
        resource1Use: { kind: "text", label: "Recurso 1 — uso" },
        resource2Label: { kind: "text", label: "Recurso 2 — nombre" },
        resource2Use: { kind: "text", label: "Recurso 2 — uso" },
        resource3Label: { kind: "text", label: "Recurso 3 — nombre" },
        resource3Use: { kind: "text", label: "Recurso 3 — uso" },
        resource4Label: { kind: "text", label: "Recurso 4 — nombre" },
        resource4Use: { kind: "text", label: "Recurso 4 — uso" },
        resource5Label: { kind: "text", label: "Recurso 5 — nombre" },
        resource5Use: { kind: "text", label: "Recurso 5 — uso" },
        rules: {
          kind: "list",
          label: "Conceptos / reglas",
          itemLabel: "Regla",
          fields: {
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Explicación", rows: 3 },
          },
        },
      },
      defaults: {
        eyebrow: "Cómo se juega",
        title: "Una isla, cinco recursos, mil partidas.",
        subtitle:
          "Catan se juega sobre un mapa modular de losetas hexagonales. Cada loseta produce un recurso y los jugadores compiten por construir el mejor imperio comercial. Aquí lo tienes en un vistazo.",
        resourcesTitle: "Los 5 recursos",
        resource1Label: "Madera",
        resource1Use: "Caminos y cartas de desarrollo",
        resource2Label: "Piedra",
        resource2Use: "Ciudades y desarrollo",
        resource3Label: "Trigo",
        resource3Use: "Colonos, ciudades y desarrollo",
        resource4Label: "Arcilla",
        resource4Use: "Caminos y poblados",
        resource5Label: "Lana",
        resource5Use: "Poblados y desarrollo",
        rules: [
          {
            title: "Construye y expande",
            body: "Empiezas con dos poblados y dos caminos. En cada turno, tira los dados, recolecta recursos y decide: ¿caminos, poblados, ciudades o cartas de desarrollo?",
          },
          {
            title: "Comercia con todos",
            body: "El alma de Catan es el trueque. Cambia tus recursos sobrantes con otros jugadores o con el banco. Negociar bien vale más que tirar buenos dados.",
          },
          {
            title: "Llega a 10 puntos",
            body: "Cada poblado vale 1 punto, cada ciudad 2. Suma con la carretera más larga, el ejército más grande y las cartas de victoria. El primero en 10 gana.",
          },
        ],
      },
    },
    {
      key: "catan.tournaments",
      label: "Torneos y comunidad",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Torneos / actividades",
          itemLabel: "Torneo",
          fields: {
            title: { kind: "text", label: "Nombre del torneo" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
            image: { kind: "image", label: "Imagen (opcional)" },
          },
        },
      },
      defaults: {
        eyebrow: "La comunidad",
        title: "Torneos cada mes, partidas cada semana",
        subtitle:
          "Organizamos torneos abiertos a todos los niveles cada mes, además de partidas regulares semanales. Apúntate por WhatsApp y nos vemos en la mesa.",
        items: [
          {
            title: "Liga mensual KLEFF Catan",
            body: "Una jornada al mes con formato de liga: rondas suizas, premios y mucha negociación. Apto para todos los niveles.",
            image: "",
          },
          {
            title: "Catan para principiantes",
            body: "Mesa específica para quienes nunca han jugado. Te explicamos las reglas y juegas tu primera partida con jugadores que también empiezan.",
            image: "",
          },
          {
            title: "Noches de expansión",
            body: "Marineros, Ciudades y Caballeros, Bárbaros… organizamos noches temáticas para descubrir cada expansión.",
            image: "",
          },
        ],
      },
    },
    {
      key: "catan.cta",
      label: "CTA final · WhatsApp",
      fields: {
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        whatsappLabel: { kind: "text", label: "Texto del botón" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo" },
      },
      defaults: {
        title: "¿Te unes a la colonia?",
        subtitle:
          "Entra al grupo de WhatsApp para enterarte del próximo torneo, apuntarte a las partidas semanales y conocer al resto de la comunidad de Catan en KLEFF.",
        whatsappLabel: "Unirme al WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/FbVhgyrIZXBJPrxC0DqoCE",
      },
    },
  ],
};

// ---------------- TOURNAMENTS ----------------

const tournamentsSchema: PageSchema = {
  key: "tournaments",
  label: "Torneos",
  path: "/torneos",
  description:
    "Página de la comunidad de Torneos: hero, formatos, premios y galería. Editable inline y con auto-traducción a CA y EN.",
  sections: [
    {
      key: "tournaments.hero",
      label: "Hero (cabecera)",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título principal" },
        subtitle: { kind: "textarea", label: "Subtítulo / intro", rows: 4 },
        whatsappLabel: { kind: "text", label: "Texto del botón de WhatsApp" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo de WhatsApp" },
        catanLinkLabel: { kind: "text", label: "Texto del enlace a Catan" },
        stat1Label: { kind: "text", label: "Estadística 1 — etiqueta" },
        stat2Label: { kind: "text", label: "Estadística 2 — etiqueta" },
        stat3Label: { kind: "text", label: "Estadística 3 — etiqueta" },
      },
      defaults: {
        eyebrow: "Comunidad · Torneos cada mes",
        title: "Torneos en KLEFF",
        subtitle:
          "Varios torneos al mes de los juegos más populares de la comunidad: aptos para todos los públicos, formatos avanzados y temáticos. Tenemos jornadas especiales del clásico Catan (echa un vistazo a su comunidad), torneos relámpago de juegos rápidos y eliminatorias temáticas.",
        whatsappLabel: "Únete al grupo de WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/EI7DjJU1UtgKcvsQO8KUOX",
        catanLinkLabel: "Ver comunidad Catan →",
        stat1Label: "Torneos / mes",
        stat2Label: "Jugadores",
        stat3Label: "Juegos al año",
      },
    },
    {
      key: "tournaments.formats",
      label: "Cómo funcionan los torneos",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 3 },
        freeTitle: { kind: "text", label: "Inscripción gratuita — título" },
        freeBody: { kind: "textarea", label: "Inscripción gratuita — cuerpo", rows: 3 },
        paidTitle: { kind: "text", label: "Inscripción con premio — título" },
        paidBody: { kind: "textarea", label: "Inscripción con premio — cuerpo", rows: 3 },
        items: {
          kind: "list",
          label: "Formatos",
          itemLabel: "Formato",
          fields: {
            title: { kind: "text", label: "Nombre del formato" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
          },
        },
      },
      defaults: {
        eyebrow: "Cómo funcionan",
        title: "Formatos para todos los gustos",
        subtitle:
          "Algunos torneos son totalmente gratuitos. En otros, hay una pequeña cuota de inscripción que se destina íntegramente a los premios para los ganadores.",
        freeTitle: "Inscripción gratuita",
        freeBody:
          "La mayoría de torneos son gratis. Solo necesitas la consumición habitual del local. Apuntarte por WhatsApp y presentarte el día.",
        paidTitle: "Cuota destinada a premios",
        paidBody:
          "En los torneos con cuota, el 100% del dinero se reparte como premios entre los primeros clasificados. Sin ánimo de lucro, todo para la comunidad.",
        items: [
          {
            title: "1 vs 1",
            body: "Enfrentamientos directos en juegos para dos. Eliminación o ronda de grupos según jugadores.",
          },
          {
            title: "Sistema suizo",
            body: "Todos juegan el mismo número de rondas. Cada ronda emparejas con alguien de tu mismo nivel de victorias. Justo y rápido.",
          },
          {
            title: "Clasificatorio + final",
            body: "Fase de grupos para clasificar a los mejores y final a una sola partida. Tensión máxima.",
          },
          {
            title: "Aptos para todos",
            body: "Mezclamos jugadores nuevos y veteranos. Siempre hay categoría principiante y nadie queda fuera.",
          },
          {
            title: "Avanzados",
            body: "Algunos torneos son específicamente para jugadores con experiencia. Reglas oficiales, reloj de tiempo y reglas avanzadas.",
          },
          {
            title: "Temáticos",
            body: "Noches especiales: Halloween, Navidad, expansiones concretas… cada mes un giro distinto.",
          },
        ],
      },
    },
    {
      key: "tournaments.prizes",
      label: "Premios",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 3 },
        items: {
          kind: "list",
          label: "Ejemplos de premios",
          itemLabel: "Premio",
          fields: {
            title: { kind: "text", label: "Premio" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
            image: { kind: "image", label: "Imagen del premio" },
          },
        },
      },
      defaults: {
        eyebrow: "Los premios",
        title: "Algo más que un trofeo",
        subtitle:
          "Juegos, expansiones, vales para la ludoteca, descuentos en colaboradores… cada torneo tiene sus propios premios. Aquí tienes algunos ejemplos.",
        items: [
          { title: "Juegos de mesa", body: "Cajas nuevas donadas por editoriales y tiendas colaboradoras.", image: "" },
          { title: "Expansiones", body: "Para que sigas alargando la vida de tus juegos favoritos.", image: "" },
          { title: "Vales y descuentos", body: "Vales para la ludoteca KLEFF y descuentos en tiendas colaboradoras.", image: "" },
        ],
      },
    },
    {
      key: "tournaments.gallery",
      label: "Galería · Participantes",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Fotos",
          itemLabel: "Foto",
          fields: {
            image: { kind: "image", label: "Imagen" },
            caption: { kind: "text", label: "Pie de foto" },
          },
        },
      },
      defaults: {
        eyebrow: "El ambiente",
        title: "La gente que hace los torneos",
        subtitle:
          "Caras conocidas, partidas reñidas y mucha buena onda. Así se viven los torneos de KLEFF.",
        items: [],
      },
    },
    {
      key: "tournaments.faq",
      label: "FAQ",
      description: "Preguntas frecuentes con respuesta desplegable. Categorías sugeridas: formatos, cuotas, reglas, cómo apuntarse.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Preguntas",
          itemLabel: "Pregunta",
          fields: {
            category: { kind: "text", label: "Categoría (Formatos / Cuotas / Reglas / Cómo apuntarse)" },
            question: { kind: "text", label: "Pregunta" },
            answer: { kind: "textarea", label: "Respuesta", rows: 5 },
          },
        },
      },
      defaults: {
        eyebrow: "Preguntas frecuentes",
        title: "Todo lo que quieres saber",
        subtitle: "Resolvemos las dudas más habituales sobre nuestros torneos.",
        items: [
          {
            category: "Formatos",
            question: "¿Qué formatos de torneo organizáis?",
            answer:
              "Organizamos formatos 1 vs 1 para juegos de dos jugadores, sistema suizo (todos juegan el mismo número de rondas) y clasificatorios con fase de grupos y final. Algunos torneos son temáticos (Halloween, Navidad, expansiones concretas).",
          },
          {
            category: "Cuotas",
            question: "¿Los torneos tienen coste de inscripción?",
            answer:
              "La mayoría son gratuitos: solo necesitas la consumición habitual del local. En los torneos con cuota, el 100% del importe se reparte como premios entre los ganadores. KLEFF es una asociación sin ánimo de lucro: nada se queda en la organización.",
          },
          {
            category: "Reglas",
            question: "¿Qué reglas se utilizan?",
            answer:
              "Usamos las reglas oficiales de cada juego. En torneos avanzados aplicamos también reloj de tiempo y reglas competitivas oficiales. Antes de empezar siempre se hace un repaso para que todo el mundo juegue con las mismas reglas.",
          },
          {
            category: "Reglas",
            question: "¿Hace falta tener experiencia para participar?",
            answer:
              "No. La mayoría de torneos son aptos para todos los niveles, incluyendo principiantes. Mezclamos jugadores nuevos y veteranos. Algunos torneos están específicamente marcados como 'avanzados' y se anuncia con antelación.",
          },
          {
            category: "Cómo apuntarse",
            question: "¿Cómo me apunto a un torneo?",
            answer:
              "Únete al grupo de WhatsApp de Torneos. Allí publicamos las fechas, formatos, juegos y enlace para apuntarte. La inscripción suele cerrarse 24-48 horas antes del torneo para poder organizar las mesas.",
          },
          {
            category: "Cómo apuntarse",
            question: "¿Puedo venir solo?",
            answer:
              "Sí, de hecho mucha gente viene sola. En los torneos te emparejamos automáticamente con otros jugadores. Es una de las mejores formas de conocer a la comunidad.",
          },
        ],
      },
    },
    {
      key: "tournaments.cta",
      label: "CTA final · WhatsApp",
      fields: {
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        whatsappLabel: { kind: "text", label: "Texto del botón" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo" },
      },
      defaults: {
        title: "¿Te animas al próximo torneo?",
        subtitle:
          "Entra al grupo de WhatsApp para enterarte de las fechas, formatos y premios de los próximos torneos en KLEFF.",
        whatsappLabel: "Unirme al WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/EI7DjJU1UtgKcvsQO8KUOX",
      },
    },
  ],
};

// ---------------- ABOUT ----------------

const aboutSchema: PageSchema = {
  key: "about",
  label: "Quiénes somos",
  path: "/sobre-nosotros",
  description: "Página About: hero, misión, manifiesto, El Hilo (timeline editable) y Equipo (miembros editables).",
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
      key: "about.timeline",
      label: "El Hilo (timeline)",
      description: "Hitos en la historia de KLEFF. Puedes añadir, editar y reordenar.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        titlePrefix: { kind: "text", label: "Título — prefijo" },
        titleHighlight: { kind: "text", label: "Título — palabra destacada (con marker)" },
        titleSuffix: { kind: "text", label: "Título — sufijo" },
        intro: { kind: "text", label: "Intro corta" },
        items: {
          kind: "list",
          label: "Hitos",
          itemLabel: "Hito",
          fields: {
            year: { kind: "text", label: "Año / etiqueta (ej: 2018, 2019 (I), OCT 2019)" },
            emoji: { kind: "text", label: "Emoji" },
            title: { kind: "text", label: "Título del hito" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
          },
        },
      },
      defaults: {
        eyebrow: "El hilo",
        titlePrefix: "De 2018 a",
        titleHighlight: "hoy",
        titleSuffix: ", hito a hito.",
        intro: "Sigue los números para recorrer la historia de KLEFF →",
        items: [
          { year: "2018", emoji: "🌱", title: "Una receta inesperada", body: "Pau atraviesa una depresión. La psicóloga le receta algo poco común: salir, probar, conocer gente. Idiomas, teatro, fotografía… y un Meetup de juegos de mesa que lo cambiaría todo." },
          { year: "2019 (I)", emoji: "🎲", title: "Martes de juegos, domingos al sol", body: "Pau empieza a organizar martes noche de juegos y desayunos dominicales con juegos en el Parc de la Ciutadella." },
          { year: "OCT 2019", emoji: "🎉", title: "Nace KLEFF", body: "Tras un año reuniéndose cada semana, Pau y su socio fundan KLEFF. Era hora de convertir aquella afición en comunidad." },
          { year: "2019 (II)", emoji: "🍻", title: "+30 personas cada semana", body: "La noche de juegos semanal se establece como evento fijo. Las mesas se llenan, los desconocidos se hacen amigos." },
          { year: "2020-21", emoji: "🕵️", title: "Pandemia y Treasure Hunts", body: "Seguimos jugando online y, después, presencial al aire libre. Nacen los Treasure Hunt: «Descubre Barcelona», «Movie's Walk» y «El Caso Méliès»." },
          { year: "2021", emoji: "🍽️", title: "Pasatapas, casa nueva", body: "Nos instalamos en el Restaurante Pasatapas. KLEFF se convierte en la comunidad de juegos de mesa más grande de Barcelona." },
          { year: "2023", emoji: "🎬", title: "Boardgaming for Fun", body: "Junto con Mathom organizamos «Barcelona Boardgaming for Fun» en el Movistar Centre, mezclando juegos y exposiciones audiovisuales." },
          { year: "2025", emoji: "🚉", title: "L'Estació, +200 por noche", body: "KLEFF se reinventa: nueva sede en L'Estació – Espai Gastronòmic, más colaboradores y noches multitudinarias con más de 200 asistentes." },
          { year: "2026", emoji: "📜", title: "Asociación oficial", body: "KLEFF se constituye formalmente como asociación sin ánimo de lucro. Lo que empezó como terapia, hoy es movimiento." },
        ],
      },
    },
    {
      key: "about.team",
      label: "Equipo (#TeamKLEFF)",
      description: "Miembros del equipo. Cada uno tiene una foto, rol, bio (parte trasera de la tarjeta), juego favorito, color y número de la suerte.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "text", label: "Subtítulo" },
        items: {
          kind: "list",
          label: "Miembros",
          itemLabel: "Miembro",
          fields: {
            name: { kind: "text", label: "Nombre" },
            role: { kind: "text", label: "Rol (ej: Arquitecto de juegos)" },
            emoji: { kind: "text", label: "Emoji (ej: 🎲)" },
            photo: { kind: "image", label: "Foto" },
            bio: { kind: "textarea", label: "Bio (parte trasera)", rows: 4 },
            favoriteGame: { kind: "text", label: "Juego favorito" },
            color: { kind: "text", label: "Color favorito" },
            luckyNumber: { kind: "text", label: "Número de la suerte" },
          },
        },
      },
      defaults: {
        eyebrow: "#TeamKLEFF",
        title: "El equipo",
        subtitle: "Las personas detrás de cada Game Night.",
        items: [
          { name: "Pau", role: "Fundador & Estrategia", emoji: "🎲", photo: "https://kleff.es/wp-content/uploads/2025/08/Pau_kleff-225x300.jpg", bio: "Responsable de buscar colaboraciones y crear nuevos eventos. Toma las decisiones estratégicas. De día abogado de startups; de noche, una buena peli con pizza margherita.", favoriteGame: "King of Tokyo", color: "Azul", luckyNumber: "7" },
          { name: "Pol", role: "Arquitecto de juegos", emoji: "🏗️", photo: "https://kleff.es/wp-content/uploads/2025/08/Pol_kleff-225x300.jpg", bio: "Mantiene el orden en la colección de juegos de KLEFF. Se describe como arquitecto de juegos, colaborando con autores y editores para perfeccionar reglas.", favoriteGame: "Splendor", color: "Azul", luckyNumber: "7" },
          { name: "Beatriz", role: "Eventos & retos", emoji: "🎯", photo: "https://kleff.es/wp-content/uploads/2025/09/Beatriz-225x300.jpg", bio: "Apoya en la organización de eventos. Maestra de educación infantil con corazón de jugona. Le encanta diseñar retos, enseñar jugando y vivir aventuras.", favoriteGame: "Stone Age", color: "Me gusta variar", luckyNumber: "2" },
          { name: "Jordi", role: "Equipo KLEFF", emoji: "🎮", photo: "https://kleff.es/wp-content/uploads/2025/09/Jordi-225x300.jpg", bio: "Próximamente. Estamos preparando su ficha completa.", favoriteGame: "—", color: "—", luckyNumber: "—" },
          { name: "Karen", role: "Equipo KLEFF", emoji: "✨", photo: "https://kleff.es/wp-content/uploads/2025/09/Karen-225x300.jpg", bio: "Próximamente. Estamos preparando su ficha completa.", favoriteGame: "—", color: "—", luckyNumber: "—" },
          { name: "Leiro", role: "Equipo KLEFF", emoji: "🃏", photo: "https://kleff.es/wp-content/uploads/2025/09/Leiro-225x300.jpg", bio: "Próximamente. Estamos preparando su ficha completa.", favoriteGame: "—", color: "—", luckyNumber: "—" },
          { name: "Eric", role: "Equipo KLEFF", emoji: "🎲", photo: "https://kleff.es/wp-content/uploads/2025/09/Eric-225x300.jpg", bio: "Próximamente. Estamos preparando su ficha completa.", favoriteGame: "—", color: "—", luckyNumber: "—" },
        ],
      },
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
  description: "Página de cómo funciona KLEFF. Pasos, actividades, comunidades y beneficios de socio totalmente editables.",
  sections: [
    {
      key: "how.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 4 },
        nonProfitTitle: { kind: "text", label: "Badge ONG" },
        consumptionBadge: { kind: "text", label: "Badge consumición" },
      },
      defaults: { eyebrow: "", title: "", intro: "", nonProfitTitle: "Asociación sin ánimo de lucro", consumptionBadge: "Consumición 4 €" },
    },
    {
      key: "how.steps",
      label: "Paso a paso (3 pasos)",
      description: "Cabecera + los 3 bloques de 'cómo funciona una noche'.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Cuerpo bajo el título", rows: 3 },
        items: {
          kind: "list",
          label: "Pasos",
          itemLabel: "Paso",
          fields: {
            title: { kind: "text", label: "Título del paso" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
          },
        },
      },
      defaults: {
        eyebrow: "Paso a paso",
        title: "Vienes solo, en pareja o con amigos. Da igual.",
        body: "No necesitas reservar mesa ni traer a nadie. Si vienes solo, te emparejan con gente buscando mesa, te recomiendan un juego según tus ganas y te lo explican si no lo conoces. En 10 minutos estás riéndote con desconocidos.",
        items: [
          { title: "Llegas", body: "Entras en l'Estació Espai Gastronòmic. Pides una bebida (esa es la consumición de 4 €) o algo de picar. Un miembro del #TeamKLEFF te recibe en la recepción." },
          { title: "Encuentras mesa", body: "Si vienes sin compañía, te emparejamos con gente buscando mesa, recomendamos un juego según tus preferencias y te lo explicamos si no lo conoces." },
          { title: "Juegas y vuelves", body: "Más de 500 juegos disponibles. Cuando termines una partida, prueba otra mesa o quédate en la tuya. La noche dura 4 horas y nadie tiene prisa." },
        ],
      },
    },
    {
      key: "how.activities",
      label: "Actividades",
      description: "Cabecera + lista de actividades. Cada una con frecuencia (etiqueta) y emoji.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Actividades",
          itemLabel: "Actividad",
          fields: {
            cadence: { kind: "text", label: "Cadencia (Semanal / Mensual / Anual / Puntual)" },
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
            emoji: { kind: "text", label: "Emoji" },
          },
        },
      },
      defaults: {
        eyebrow: "Actividades",
        title: "Qué puedes encontrar",
        subtitle: "Desde la noche de juegos semanal hasta torneos, citas lúdicas y eventos solidarios.",
        items: [
          { cadence: "Semanal", title: "Noche de Juegos", body: "Evento regular con ludoteca abierta y partidas programadas de Blood on the Clocktower, Catan y otros muchos.", emoji: "🎲" },
          { cadence: "Mensual", title: "Torneos", body: "Actividad competitiva de los juegos más populares de la comunidad.", emoji: "🏆" },
          { cadence: "Mensual", title: "Demostraciones de editoriales y autores", body: "Jornadas para aprender juegos nuevos directamente con quienes los han creado y publicado.", emoji: "📦" },
          { cadence: "Puntual", title: "Slow Dating Lúdico", body: "Concepto similar al speed dating, pero con juegos sociales como excusa para conectar a personas.", emoji: "💘" },
          { cadence: "Anual", title: "Game Night: Carnival", body: "Noche de juegos especial con concurso de disfraces de carnaval.", emoji: "🎭" },
          { cadence: "Anual", title: "Game Night: Halloween", body: "Noche de juegos especial con concurso de disfraces de temática Halloween.", emoji: "🎃" },
          { cadence: "Anual", title: "X-Mas Game Night", body: "Evento solidario para recaudar fondos para el Hospital Sant Joan de Déu, especializado en cáncer infantil.", emoji: "🎄" },
        ],
      },
    },
    {
      key: "how.communities",
      label: "Comunidades",
      description: "4 comunidades destacadas. Cada una puede llevar a otra página interna.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
        items: {
          kind: "list",
          label: "Comunidades",
          itemLabel: "Comunidad",
          fields: {
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
            tag: { kind: "text", label: "Etiqueta (chip)" },
            emoji: { kind: "text", label: "Emoji" },
            href: { kind: "url", label: "Enlace (opcional, ej: /blood-on-the-clocktower)" },
            ctaLabel: { kind: "text", label: "Texto del enlace (si hay href)" },
          },
        },
      },
      defaults: {
        eyebrow: "Comunidades",
        title: "Comunidades dentro de KLEFF",
        intro: "Más allá de las noches de juegos, hay grupos vivos alrededor de juegos concretos.",
        items: [
          { title: "Blood on the Clocktower", body: "Comunidad activa que se reúne cada semana. Hasta 3 partidas simultáneas con diferentes niveles.", tag: "Semanal", emoji: "💀", href: "/blood-on-the-clocktower", ctaLabel: "Ver página" },
          { title: "Catan", body: "Grupo de jugadores de Catan que se reúnen para partidas regulares y torneos.", tag: "Mensual", emoji: "⬢", href: "", ctaLabel: "" },
          { title: "Wargames", body: "Comunidad para amantes de los juegos de estrategia y guerra: desde Risk hasta wargames de miniaturas.", tag: "Puntual", emoji: "⚔️", href: "", ctaLabel: "" },
          { title: "Juegos ocultos", body: "Grupo de juegos de información oculta y deducción: roles secretos, traidores, deducción social.", tag: "Mensual", emoji: "👁️", href: "", ctaLabel: "" },
        ],
      },
    },
    {
      key: "how.member",
      label: "Hazte socio",
      description: "Cabecera, lista de beneficios (cards flip) y CTA final.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        flipHint: { kind: "text", label: "Pista para girar las tarjetas" },
        ctaTitle: { kind: "text", label: "CTA — título" },
        ctaBody: { kind: "textarea", label: "CTA — cuerpo", rows: 3 },
        ctaLabel: { kind: "text", label: "CTA — botón" },
        items: {
          kind: "list",
          label: "Beneficios",
          itemLabel: "Beneficio",
          fields: {
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Descripción (parte trasera)", rows: 3 },
            emoji: { kind: "text", label: "Emoji" },
          },
        },
      },
      defaults: {
        eyebrow: "Hazte socio",
        title: "Beneficios de ser #kleffer",
        subtitle: "Apoya la asociación, accede a beneficios y forma parte del núcleo de la comunidad.",
        flipHint: "Toca cada tarjeta para descubrir el beneficio",
        ctaTitle: "¿Listo para unirte?",
        ctaBody: "Escríbenos un email y te explicamos cómo darte de alta como socio.",
        ctaLabel: "Quiero ser socio",
        items: [
          { title: "Ludoteca para llevar", body: "Llévate juegos a casa para probar entre semana, gratis para socios.", emoji: "📚" },
          { title: "Eventos exclusivos", body: "Acceso prioritario a torneos, demos cerradas y noches especiales.", emoji: "⚡" },
          { title: "Descuentos", body: "Descuentos en colaboraciones con tiendas y editoriales.", emoji: "🏷️" },
          { title: "Apoyas la causa", body: "Tu cuota ayuda a que KLEFF siga organizando eventos solidarios y abiertos a todos.", emoji: "❤️" },
        ],
      },
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
      key: "media.press",
      label: "Cabecera de prensa",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        helper: { kind: "text", label: "Texto de ayuda (debajo del título)" },
      },
      defaults: { eyebrow: "Apariciones en prensa", title: "Lo que dicen los medios", helper: "" },
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

// ---------------- HIDDEN ROLES ----------------

const hiddenRolesSchema: PageSchema = {
  key: "hiddenRoles",
  label: "Roles ocultos",
  path: "/roles-ocultos",
  description:
    "Comunidad de juegos de roles ocultos: deducción social, mentiras, identidades secretas, murder mysteries, Hidden Roles Fest y selección de juegos destacados.",
  sections: [
    {
      key: "hiddenRoles.hero",
      label: "Hero (cabecera)",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título principal" },
        subtitle: { kind: "textarea", label: "Subtítulo / intro", rows: 4 },
        whatsappLabel: { kind: "text", label: "Texto del botón de WhatsApp" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo de WhatsApp" },
        stat1Value: { kind: "text", label: "Stat 1 — valor" },
        stat1Label: { kind: "text", label: "Stat 1 — etiqueta" },
        stat2Value: { kind: "text", label: "Stat 2 — valor" },
        stat2Label: { kind: "text", label: "Stat 2 — etiqueta" },
        stat3Value: { kind: "text", label: "Stat 3 — valor" },
        stat3Label: { kind: "text", label: "Stat 3 — etiqueta" },
      },
      defaults: {
        eyebrow: "Comunidad · Partidas semanales",
        title: "Roles Ocultos en KLEFF",
        subtitle:
          "Una comunidad enorme y muy activa unida por la pasión por los juegos de deducción social, mentiras y traiciones. Más de 200 miembros, partidas cada semana y eventos temáticos donde nadie sabe quién es de fiar… hasta que es demasiado tarde.",
        whatsappLabel: "Únete al grupo de WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/ILH8sNsRl3o6xlOn62zNA8",
        stat1Value: "200+",
        stat1Label: "Miembros",
        stat2Value: "Semanal",
        stat2Label: "Partidas",
        stat3Value: "4",
        stat3Label: "Hidden Roles Fest/año",
      },
    },
    {
      key: "hiddenRoles.intro",
      label: "¿Qué son los juegos de roles ocultos?",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Descripción", rows: 8 },
      },
      defaults: {
        eyebrow: "El género",
        title: "Mentiras, traiciones e identidades secretas.",
        body:
          "En los juegos de roles ocultos cada jugador recibe en secreto un rol —leal, traidor, asesino, líder, espía…— y debe usar la información que tiene (o que finge tener) para ganar a su bando. Algunos roles colaboran abiertamente, otros sabotean desde dentro y la mayoría no sabe en quién confiar.\n\nLa magia está en la mesa: lo importante no son las cartas, sino las conversaciones, las miradas, las acusaciones y las votaciones a vida o muerte. Es un género ideal para grupos grandes, perfecto para conocer gente nueva y absolutamente adictivo cuando empiezas a ver quién miente bien y quién muy mal.",
      },
    },
    {
      key: "hiddenRoles.types",
      label: "Tipos de juegos",
      description: "Subgéneros y características destacadas con tarjetas tipo polaroid.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        items: {
          kind: "list",
          label: "Tipos",
          itemLabel: "Tipo",
          fields: {
            tag: { kind: "text", label: "Etiqueta corta (esquina)" },
            title: { kind: "text", label: "Título" },
            body: { kind: "textarea", label: "Descripción", rows: 3 },
            example: { kind: "text", label: "Ejemplo de juego" },
          },
        },
      },
      defaults: {
        eyebrow: "Subgéneros",
        title: "No todos los traidores juegan igual.",
        subtitle: "Hay un juego de roles ocultos para cada tipo de mesa: desde la deducción más fría hasta el roleo más teatral.",
        items: [
          {
            tag: "Deducción social",
            title: "Mira, escucha, deduce",
            body: "Lo importante es leer a la mesa: quién tarda en hablar, quién evita una pregunta, quién acusa demasiado pronto. Partidas tensas y muy parlanchinas.",
            example: "Ej.: The Resistance: Avalon",
          },
          {
            tag: "Lógica e información",
            title: "Pistas que encajan",
            body: "Cada turno revela información parcial. El bando bueno tiene que cruzarla; el malo, ensuciarla. Premia la atención y la paciencia.",
            example: "Ej.: Deception: Murder in Hong Kong",
          },
          {
            tag: "Engaños y faroles",
            title: "Miente con cara de póker",
            body: "Aquí ganan los que se atreven a marcarse un farol… y los que saben cuándo creer al de enfrente. Mucho ego, mucha risa.",
            example: "Ej.: Coup, Mascarade",
          },
          {
            tag: "Identidades secretas",
            title: "¿Quién eres realmente?",
            body: "Cada jugador esconde su rol. Algunos se conocen entre sí, otros van completamente a ciegas. La traición está garantizada.",
            example: "Ej.: Secret Hitler, Salem 1692",
          },
          {
            tag: "Roleplaying",
            title: "Métete en el papel",
            body: "Más allá de las mecánicas, lo que importa es interpretar. Acentos, coartadas, monólogos finales y mucha vergüenza superada.",
            example: "Ej.: Murder Mystery, Blood on the Clocktower",
          },
          {
            tag: "Equipos y traidores",
            title: "Confía… hasta que no",
            body: "Variantes en las que un equipo aparentemente unido descubre que tiene topos dentro. La cooperación se convierte en paranoia.",
            example: "Ej.: Infiltraitors, Traitors Aboard",
          },
        ],
      },
    },
    {
      key: "hiddenRoles.clocktower",
      label: "Mención a Blood on the Clocktower",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Descripción", rows: 4 },
        ctaLabel: { kind: "text", label: "Texto del botón" },
      },
      defaults: {
        eyebrow: "Comunidad hermana",
        title: "Blood on the Clocktower tiene su propia liga.",
        body:
          "Es el rey de los juegos de roles ocultos: tan grande, que tiene su propia comunidad dentro de KLEFF, con partidas semanales, distintos niveles y una Storyteller dedicada. Si te gustan los roles ocultos, esta es tu siguiente parada.",
        ctaLabel: "Ir a la comunidad de Clocktower",
      },
    },
    {
      key: "hiddenRoles.murder",
      label: "Murder Mystery",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Descripción", rows: 6 },
        feature1: { kind: "text", label: "Feature 1" },
        feature2: { kind: "text", label: "Feature 2" },
        feature3: { kind: "text", label: "Feature 3" },
        image: { kind: "image", label: "Imagen ambiente (opcional)" },
      },
      defaults: {
        eyebrow: "Eventos temáticos",
        title: "Murder Mystery: una noche, un crimen, un asesino entre nosotros.",
        body:
          "Un Murder Mystery es una velada donde cada participante encarna un personaje con su propia historia, motivos y secretos. Uno de ellos es el asesino y el resto debe descubrirlo a base de interrogatorios, pistas y mucho roleo. En KLEFF los organizamos de forma periódica, con guion propio o con materiales licenciados.",
        feature1: "Aptos para todos los niveles",
        feature2: "En castellano, catalán e inglés",
        feature3: "Plazas limitadas — reserva imprescindible",
        image: "",
      },
    },
    {
      key: "hiddenRoles.fest",
      label: "Hidden Roles Fest",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        body: { kind: "textarea", label: "Descripción", rows: 5 },
        bullet1: { kind: "text", label: "Bullet 1" },
        bullet2: { kind: "text", label: "Bullet 2" },
        bullet3: { kind: "text", label: "Bullet 3" },
        bullet4: { kind: "text", label: "Bullet 4" },
      },
      defaults: {
        eyebrow: "Evento estrella",
        title: "Hidden Roles Fest",
        body:
          "Cada trimestre organizamos el Hidden Roles Fest: una jornada entera dedicada a los juegos de roles ocultos. Mesas de los grandes clásicos, partidas relámpago, deducción social, murder mysteries especiales y partidas temáticas de Blood on the Clocktower. La fiesta del género.",
        bullet1: "Múltiples mesas en paralelo",
        bullet2: "Murder mysteries especiales",
        bullet3: "Clocktower temático",
        bullet4: "Premios y sorpresas",
      },
    },
    {
      key: "hiddenRoles.library",
      label: "Ludoteca · Roles ocultos",
      description:
        "Selección de juegos de roles ocultos. Indica los slugs (de la API de Ludoya) que quieres priorizar; se mostrarán los 8 con mejor puntuación BGG.",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        ctaLabel: { kind: "text", label: "Texto del enlace a /ludoteca" },
        slugs: {
          kind: "list",
          label: "Slugs candidatos (Ludoya)",
          itemLabel: "Slug",
          fields: {
            slug: { kind: "text", label: "Slug del juego (ej: secret-hitler)" },
          },
        },
      },
      defaults: {
        eyebrow: "Nuestra ludoteca",
        title: "Algunos de nuestros favoritos",
        subtitle: "Una selección con los 8 mejor puntuados en BoardGameGeek dentro de los roles ocultos. Tienes muchos más en el local.",
        ctaLabel: "Ver toda la ludoteca",
        slugs: [
          { slug: "blood-on-the-clocktower" },
          { slug: "the-resistance-avalon" },
          { slug: "secret-hitler" },
          { slug: "deception-murder-in-hong-kong" },
          { slug: "coup-3" },
          { slug: "mascarade-2" },
          { slug: "salem-1692" },
          { slug: "hidden-leaders" },
          { slug: "infiltraitors" },
          { slug: "traitors-aboard" },
        ],
      },
    },
    {
      key: "hiddenRoles.cta",
      label: "CTA final · Únete",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta" },
        title: { kind: "text", label: "Título" },
        subtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        whatsappLabel: { kind: "text", label: "Texto del botón" },
        whatsappUrl: { kind: "url", label: "Enlace del grupo de WhatsApp" },
      },
      defaults: {
        eyebrow: "Únete",
        title: "¿Quién será el próximo traidor?",
        subtitle:
          "Entra al grupo de WhatsApp para enterarte de las próximas partidas, murder mysteries y del calendario del Hidden Roles Fest.",
        whatsappLabel: "Unirme al WhatsApp",
        whatsappUrl: "https://chat.whatsapp.com/ILH8sNsRl3o6xlOn62zNA8",
      },
    },
  ],
};

// ---------------- ACTIVITIES ----------------

const activitiesSchema: PageSchema = {
  key: "activities",
  label: "Actividades",
  path: "/actividades",
  description:
    "Página de actividades: hero, Noche de Juegos, qué pasa dentro, Game Nights especiales, colaboraciones, team building y calendario.",
  sections: [
    {
      key: "activities.hero",
      label: "Hero",
      fields: {
        eyebrow: { kind: "text", label: "Etiqueta superior" },
        title: { kind: "text", label: "Título" },
        intro: { kind: "textarea", label: "Intro", rows: 3 },
        ctaMeetup: { kind: "text", label: "CTA Meetup" },
      },
      defaults: {
        eyebrow: "Actividades",
        title: "Esto es KLEFF",
        intro:
          "Nuestra actividad principal es la Noche de Juegos, cada miércoles. Dentro suceden el resto de cosas: torneos, demostraciones, Slow Friending Lúdico y ediciones especiales temáticas. Aquí te lo contamos todo.",
        ctaMeetup: "Ver próximos eventos",
      },
    },
    {
      key: "activities.main",
      label: "Noche de Juegos (principal)",
      fields: {
        mainEyebrow: { kind: "text", label: "Etiqueta superior" },
        mainTitle: { kind: "text", label: "Título" },
        mainBody1: { kind: "textarea", label: "Párrafo 1", rows: 4 },
        mainBody2: { kind: "textarea", label: "Párrafo 2", rows: 4 },
        mainCta: { kind: "text", label: "CTA" },
      },
      defaults: {
        mainEyebrow: "Cada miércoles",
        mainTitle: "La Noche de Juegos",
        mainBody1: "",
        mainBody2: "",
        mainCta: "Apúntate a la próxima Noche de Juegos",
      },
    },
    {
      key: "activities.inside",
      label: "Qué pasa dentro",
      fields: {
        insideTitle: { kind: "text", label: "Título" },
        insideSubtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        inside1Title: { kind: "text", label: "Torneos — título" },
        inside1Body: { kind: "textarea", label: "Torneos — texto", rows: 4 },
        inside2Title: { kind: "text", label: "Demos — título" },
        inside2Body: { kind: "textarea", label: "Demos — texto", rows: 4 },
        inside3Title: { kind: "text", label: "Slow Friending — título" },
        inside3Body: { kind: "textarea", label: "Slow Friending — texto", rows: 4 },
      },
      defaults: {
        insideTitle: "Qué pasa dentro de la Noche de Juegos",
        insideSubtitle: "",
        inside1Title: "Torneos",
        inside1Body: "",
        inside2Title: "Demostraciones de editoriales y autores",
        inside2Body: "",
        inside3Title: "Slow Friending Lúdico",
        inside3Body: "",
      },
    },
    {
      key: "activities.special",
      label: "Game Nights especiales",
      fields: {
        specialEyebrow: { kind: "text", label: "Etiqueta" },
        specialTitle: { kind: "text", label: "Título" },
        specialSubtitle: { kind: "textarea", label: "Subtítulo", rows: 2 },
        special1Title: { kind: "text", label: "Carnival — título" },
        special1Body: { kind: "textarea", label: "Carnival — texto", rows: 3 },
        special2Title: { kind: "text", label: "Halloween — título" },
        special2Body: { kind: "textarea", label: "Halloween — texto", rows: 3 },
        special3Title: { kind: "text", label: "X-Mas — título" },
        special3Body: { kind: "textarea", label: "X-Mas — texto", rows: 3 },
        specialNote: { kind: "textarea", label: "Nota final", rows: 2 },
      },
      defaults: {
        specialEyebrow: "Game Nights especiales",
        specialTitle: "Ediciones únicas, una vez al año",
        specialSubtitle: "",
        special1Title: "Game Night: Carnival",
        special1Body: "",
        special2Title: "Game Night: Halloween",
        special2Body: "",
        special3Title: "X-Mas Game Night",
        special3Body: "",
        specialNote: "",
      },
    },
    {
      key: "activities.collabs",
      label: "Colaboraciones",
      fields: {
        frequentEyebrow: { kind: "text", label: "Etiqueta" },
        frequentTitle: { kind: "text", label: "Título" },
        frequentBody: { kind: "textarea", label: "Párrafo 1", rows: 4 },
        partnersBody: { kind: "textarea", label: "Párrafo 2", rows: 4 },
      },
      defaults: {
        frequentEyebrow: "Colaboraciones",
        frequentTitle: "Eventos con espacios y entidades aliadas",
        frequentBody: "",
        partnersBody: "",
      },
    },
    {
      key: "activities.teamBuilding",
      label: "Team building",
      fields: {
        teamBuildingEyebrow: { kind: "text", label: "Etiqueta" },
        teamBuildingTitle: { kind: "text", label: "Título" },
        teamBuildingBody: { kind: "textarea", label: "Texto", rows: 4 },
        teamBuildingCta: { kind: "text", label: "CTA" },
      },
      defaults: {
        teamBuildingEyebrow: "A medida",
        teamBuildingTitle: "¿Quieres un evento privado o team building?",
        teamBuildingBody: "",
        teamBuildingCta: "Contáctanos",
      },
    },
    {
      key: "activities.calendar",
      label: "Calendario (CTA final)",
      fields: {
        calendarEyebrow: { kind: "text", label: "Etiqueta" },
        calendarTitle: { kind: "text", label: "Título" },
        calendarBody: { kind: "textarea", label: "Texto", rows: 3 },
        calendarCta: { kind: "text", label: "CTA" },
        calendarGroup: { kind: "text", label: "Enlace grupo" },
      },
      defaults: {
        calendarEyebrow: "Calendario",
        calendarTitle: "¿Quieres saber más sobre los eventos?",
        calendarBody: "",
        calendarCta: "Ver calendario completo en Meetup",
        calendarGroup: "O explora todo el grupo de KLEFF",
      },
    },
  ],
};

// ---------------- REGISTRY ----------------

import { LEGAL_SCHEMAS } from "./legalSchemas";

export const PAGE_SCHEMAS: PageSchema[] = [
  homeSchema,
  clocktowerSchema,
  catanSchema,
  tournamentsSchema,
  hiddenRolesSchema,
  aboutSchema,
  howSchema,
  contactSchema,
  mediaSchema,
  blogSchema,
  ludotecaSchema,
  activitiesSchema,
  ...LEGAL_SCHEMAS,
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
    // Allow arrays and non-empty values to override defaults; preserve falsy
    // numeric/boolean false (e.g. 0) but skip undefined / null / empty strings.
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v === "") continue;
    out[k] = v;
  }
  return out;
}
