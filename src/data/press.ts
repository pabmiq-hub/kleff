/**
 * Lista editable de apariciones en prensa.
 *
 * Para añadir una nueva: pega aquí la URL del artículo, opcionalmente con fecha,
 * medio o imagen manual. Si no las pones, se cargan automáticamente desde Open Graph
 * (título, descripción, imagen) vía Firecrawl en el server function `getOgPreviews`.
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
  imageOverride?: string; // si se quiere fijar la imagen a mano
  titleOverride?: string;
};

export const PRESS_LINKS: PressLink[] = [
  {
    url: "https://cadenaser.com/catalunya/2025/06/27/aqui-barcelona/",
    outlet: "Cadena SER · Aquí Barcelona",
    date: "JUN 2025",
  },
  {
    url: "https://www.rtve.es/play/videos/culturas-2/",
    outlet: "RTVE · Culturas 2",
    date: "MAY 2025",
  },
  {
    url: "https://www.timeout.es/barcelona/es/cosas-que-hacer/kleff-juegos-de-mesa-barcelona",
    outlet: "Time Out Barcelona",
    date: "MAR 2025",
  },
  {
    url: "https://www.elperiodico.com/es/barcelona/",
    outlet: "El Periódico",
    date: "MAR 2025",
  },
  {
    url: "https://www.instagram.com/sara_postcard/",
    outlet: "Sara Postcard · Planes en Barcelona",
    date: "FEB 2025",
  },
  {
    url: "https://www.elperiodico.com/es/barcelona/20191130/",
    outlet: "El Periódico",
    date: "NOV 2019",
  },
];
