/**
 * Lista editable de apariciones en prensa.
 *
 * Para añadir una nueva: pega aquí la URL del artículo, opcionalmente con fecha,
 * medio o imagen manual. Si no las pones, se cargan automáticamente desde Open Graph
 * (título, descripción, imagen) vía Firecrawl en el server function `getOgPreviews`.
 *
 * Orden: las más recientes arriba.
 */
export type PressLink = {
  url: string;
  outlet?: string;
  date?: string;
  /** Año + mes (1-12) usados para ordenar cronológicamente */
  year: number;
  month: number;
  imageOverride?: string;
  titleOverride?: string;
  descriptionOverride?: string;
};

// Imágenes de cabecera locales para medios sin OG image fiable
import imgSaraPostcard from "@/assets/media-sara-postcard.jpg";
import imgVidasInfinitas from "@/assets/media-vidas-infinitas.jpg";
import img2d6 from "@/assets/media-2d6.jpg";

// Lista cronológica (de más reciente a más antiguo)
export const PRESS_LINKS: PressLink[] = [
  // ~ febrero 2026
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20260226/barcelona-festival-gratuito-juegos-mesa-gratis-cronomaster-127232263",
    outlet: "El Periódico · Qué hacer",
    date: "FEB 2026",
    year: 2026,
    month: 2,
    descriptionOverride:
      "Festival gratuito de juegos de mesa en Barcelona: Cronomaster y la comunidad KLEFF como protagonistas.",
  },

  // ~ enero 2026
  {
    url: "https://www.3cat.cat/3cat/jocs-de-taula-per-enamorar-se-i-per-a-totes-les-ocasions/audio/1266795/",
    outlet: "Catalunya Ràdio · 3Cat",
    date: "ENE 2026",
    year: 2026,
    month: 1,
    descriptionOverride:
      "Reportaje en Catalunya Ràdio sobre los juegos de mesa para enamorarse y para todas las ocasiones, con KLEFF como referente.",
  },

  // ~ diciembre 2025
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20251219/donde-hacer-amigos-barcelona-eventos-conocer-gente-124943066",
    outlet: "El Periódico · Qué hacer",
    date: "DIC 2025",
    year: 2025,
    month: 12,
    descriptionOverride:
      "Dónde hacer amigos en Barcelona: eventos para conocer gente, con KLEFF entre las recomendaciones.",
  },

  // ~ octubre 2025
  {
    url: "https://www.youtube.com/watch?v=FWvOB_YyKns",
    outlet: "Cunyadisme Lúdic (YouTube)",
    date: "OCT 2025",
    year: 2025,
    month: 10,
    descriptionOverride:
      "Episodio del canal Cunyadisme Lúdic dedicado a la comunidad KLEFF y su escena lúdica en Barcelona.",
  },

  // ~ septiembre 2025
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20250926/convento-oculto-barcelona-demonios-bares-restaurantes-tematicos-121967054",
    outlet: "El Periódico · Qué hacer",
    date: "SEP 2025",
    year: 2025,
    month: 9,
    descriptionOverride:
      "Reportaje sobre bares y restaurantes temáticos de Barcelona, con KLEFF entre los espacios destacados.",
  },

  // ~ junio 2025
  {
    url: "https://www.eldebate.com/espana/cataluna/barcelona/20250616/kleff-congrega-250-personas-cada-miercoles-barcelona-convierte-mayor-comunidad-juegos-mesa-europa_307188.html",
    outlet: "El Debate",
    date: "JUN 2025",
    year: 2025,
    month: 6,
    descriptionOverride:
      "KLEFF congrega a 250 personas cada miércoles en Barcelona, convirtiéndose en la mayor comunidad de juegos de mesa de Europa.",
  },
  {
    url: "https://as.com/meristation/noticias/empezo-siendo-una-comunidad-y-acabo-convirtiendose-en-la-partida-mas-grande-de-juegos-de-mesa-de-europa-se-celebra-cada-miercoles-en-este-rincon-espanol-n/",
    outlet: "AS · Meristation",
    date: "JUN 2025",
    year: 2025,
    month: 6,
    descriptionOverride:
      "Empezó como una comunidad y acabó siendo la mayor partida de juegos de mesa de Europa, cada miércoles en Barcelona.",
  },
  {
    url: "https://cadenaser.com/podcast/sercat/aqui-barcelona/3953/p2/",
    outlet: "Cadena SER · Aquí Barcelona",
    date: "JUN 2025",
    year: 2025,
    month: 6,
    descriptionOverride:
      "Episodio del podcast Aquí Barcelona (Cadena SER) dedicado a la escena lúdica de la ciudad.",
  },

  // ~ mayo 2025
  {
    url: "https://www.elperiodico.com/es/ser-feliz/20250525/jose-valenzuela-neurocientifico-capacidad-fantasear-117437040",
    outlet: "El Periódico · Ser Feliz",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Entrevista al neurocientífico José Valenzuela sobre la capacidad de fantasear, con mención a la comunidad KLEFF.",
  },
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20250522/planes-dia-orgullo-friqui-barcelona-festival-triangulo-friqui-juegos-museo-alien-117635468",
    outlet: "El Periódico · Qué hacer",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Planes para el Día del Orgullo Friqui en Barcelona: festival Triángulo Friqui, juegos y KLEFF.",
  },
  {
    url: "https://www.rtve.es/play/videos/punts-de-vista/soledad-romero-ernest-armengol/16586337/",
    outlet: "RTVE · Punts de Vista",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Reportaje en Punts de Vista sobre KLEFF y el auge de los juegos de mesa en Barcelona.",
  },
  {
    url: "https://www.rtve.es/play/videos/culturas-2/susana-fortes-juanjo-braulio/16569549/",
    outlet: "RTVE · Culturas 2",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Reportaje en Culturas 2 sobre la mayor comunidad de juegos de mesa de Europa.",
  },

  // ~ marzo 2025
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20250328/juegos-mesa-barcelona-kleff-comunidad-mas-grande-europa-115781481",
    outlet: "El Periódico · Qué hacer",
    date: "MAR 2025",
    year: 2025,
    month: 3,
    descriptionOverride:
      "KLEFF, la comunidad de juegos de mesa más grande de Europa, en pleno corazón de Barcelona.",
  },
  {
    url: "https://www.elperiodico.com/es/que-hacer/planes/20250313/mejores-sitios-hacer-amigos-adulto-barcelona-actividades-socializar-115169460",
    outlet: "El Periódico · Qué hacer",
    date: "MAR 2025",
    year: 2025,
    month: 3,
    descriptionOverride:
      "Los mejores sitios para hacer amigos siendo adulto en Barcelona, con KLEFF entre las recomendaciones.",
  },
  {
    url: "https://www.timeout.es/barcelona/es/noticias/la-comunidad-de-juegos-de-mesa-mas-grande-de-europa-esta-en-barcelona-y-participar-es-gratis-030325",
    outlet: "Time Out Barcelona",
    date: "MAR 2025",
    year: 2025,
    month: 3,
    descriptionOverride:
      "La comunidad de juegos de mesa más grande de Europa está en Barcelona y participar es gratis.",
  },

  // ~ febrero 2025
  {
    url: "https://www.instagram.com/sarapostcard/reel/DF3eMGEIn28/",
    outlet: "Sara Postcard · Instagram",
    date: "FEB 2025",
    year: 2025,
    month: 2,
    imageOverride: imgSaraPostcard,
    descriptionOverride:
      "Reel viral en Instagram donde Sara Postcard descubre las Game Nights de KLEFF.",
  },

  // ~ noviembre 2022
  {
    url: "https://www.deezer.com/da/episode/454129797",
    outlet: "Vidas Infinitas (podcast)",
    date: "NOV 2022",
    year: 2022,
    month: 11,
    imageOverride: imgVidasInfinitas,
    descriptionOverride:
      "Episodio del podcast Vidas Infinitas dedicado íntegramente a la comunidad de KLEFF.",
  },

  // ~ abril 2020
  {
    url: "https://es.scribd.com/document/600871030/2d6-Magazine-21",
    outlet: "2d6 Magazine",
    date: "ABR 2020",
    year: 2020,
    month: 4,
    imageOverride: img2d6,
    descriptionOverride:
      "Artículo en 2d6 Magazine #21 sobre los inicios de KLEFF como afterwork lúdico de Barcelona.",
  },

  // ~ noviembre 2019
  {
    url: "https://www.elperiodico.com/es/que-hacer/20191107/checkpoint-gaming-bares-barcelona-gamers-videojuegos-juegos-7715170",
    outlet: "El Periódico · Qué hacer",
    date: "NOV 2019",
    year: 2019,
    month: 11,
    descriptionOverride:
      "Primer artículo de prensa sobre KLEFF, recién nacido como afterwork lúdico de Barcelona.",
  },
];
