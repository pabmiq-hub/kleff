/**
 * Lista editable de apariciones en prensa.
 *
 * Para añadir una nueva: pega aquí la URL del artículo, opcionalmente con fecha,
 * medio o imagen manual. Si no las pones, se cargan automáticamente desde Open Graph
 * (título, descripción, imagen) vía Firecrawl en el server function `getOgPreviews`.
 *
 * Orden: las más recientes arriba.
 *
 * Ejemplo mínimo:
 *   { url: "https://elpais.com/articulo-sobre-kleff" }
 *
 * Ejemplo con overrides:
 *   { url: "...", outlet: "El País", date: "MAR 2025", imageOverride: "/foto.jpg" }
 */
export type PressLink = {
  url: string;
  outlet?: string;     // si se omite, se infiere del og:site_name o del dominio
  date?: string;       // formato libre, p.ej. "JUN 2025"
  /** Año + mes (1-12) usados para ordenar cronológicamente */
  year: number;
  month: number;
  imageOverride?: string; // si se quiere fijar la imagen a mano
  titleOverride?: string;
  descriptionOverride?: string;
};

// Lista cronológica (de más reciente a más antiguo)
export const PRESS_LINKS: PressLink[] = [
  {
    url: "https://cadenaser.com/catalunya/2025/06/27/aqui-barcelona/",
    outlet: "Cadena SER · Aquí Barcelona",
    date: "JUN 2025",
    year: 2025,
    month: 6,
  },
  {
    url: "https://www.rtve.es/play/videos/culturas-2/",
    outlet: "RTVE · Culturas 2",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Reportaje en Culturas 2 sobre la mayor comunidad de juegos de mesa de Europa.",
  },
  {
    url: "https://www.rtve.es/play/videos/punts-de-vista/",
    outlet: "RTVE · Punts de Vista",
    date: "MAY 2025",
    year: 2025,
    month: 5,
    descriptionOverride:
      "Reportaje en Punts de Vista sobre KLEFF y el auge de los juegos de mesa en Barcelona.",
  },
  {
    url: "https://www.timeout.es/barcelona/es/cosas-que-hacer/kleff-juegos-de-mesa-barcelona",
    outlet: "Time Out Barcelona",
    date: "MAR 2025",
    year: 2025,
    month: 3,
  },
  {
    url: "https://www.elperiodico.com/es/barcelona/",
    outlet: "El Periódico",
    date: "MAR 2025",
    year: 2025,
    month: 3,
    descriptionOverride:
      "Artículo en El Periódico sobre KLEFF y la escena lúdica de Barcelona.",
  },
  {
    url: "https://www.instagram.com/sara_postcard/",
    outlet: "Sara Postcard · Planes en Barcelona",
    date: "FEB 2025",
    year: 2025,
    month: 2,
    descriptionOverride:
      "Reel viral en Instagram donde Sara Postcard descubre las Game Nights de KLEFF.",
  },
  {
    url: "https://vidasinfinitas.com/",
    outlet: "Vidas Infinitas (podcast)",
    date: "NOV 2022",
    year: 2022,
    month: 11,
    descriptionOverride:
      "Episodio del podcast Vidas Infinitas dedicado a la comunidad de KLEFF.",
  },
  {
    url: "https://2d6magazine.com/",
    outlet: "2d6 Magazine",
    date: "ABR 2020",
    year: 2020,
    month: 4,
    descriptionOverride:
      "Artículo en 2d6 Magazine sobre los inicios de KLEFF como afterwork lúdico de Barcelona.",
  },
  {
    url: "https://www.elperiodico.com/es/barcelona/20191130/",
    outlet: "El Periódico",
    date: "NOV 2019",
    year: 2019,
    month: 11,
    descriptionOverride:
      "Primer artículo de prensa sobre KLEFF, recién nacido como afterwork lúdico de Barcelona.",
  },
];
