// Shared block type definitions used by both editor and renderer.
export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "embed"
  | "cta"
  | "divider"
  | "quote"
  | "form_embed"
  | "hero"
  | "columns"
  | "gallery"
  | "cards"
  | "button";

export type Locale = "es" | "ca" | "en";

export type ColumnItem = { html: string; image_url?: string };
export type GalleryImage = { url: string; alt?: string; caption?: string };
export type CardItem = { image_url?: string; title: string; body?: string; cta_label?: string; cta_href?: string };

export type BlockData = {
  heading: { level: 2 | 3 | 4; text: string; align?: "left" | "center" | "right" };
  paragraph: { html: string };
  image: { url: string; alt: string; caption?: string; width?: "full" | "content" | "narrow" };
  embed: { url: string; aspect?: "16/9" | "4/3" | "1/1" };
  cta: { label: string; href: string; variant?: "primary" | "secondary"; align?: "left" | "center" | "right" };
  divider: Record<string, never>;
  quote: { html: string; attribution?: string };
  form_embed: { formSlug: string };
  hero: {
    title: string;
    subtitle?: string;
    image_url?: string;
    overlay_opacity?: number; // 0..1
    cta_label?: string;
    cta_href?: string;
    cta_variant?: "primary" | "secondary";
    align?: "left" | "center";
  };
  columns: { count: 2 | 3; items: ColumnItem[] };
  gallery: { images: GalleryImage[]; columns: 2 | 3 | 4; lightbox?: boolean };
  cards: { items: CardItem[]; columns: 2 | 3 };
  button: {
    label: string;
    href: string;
    variant: "primary" | "secondary" | "outline" | "ghost";
    size: "sm" | "md" | "lg";
    align?: "left" | "center" | "right";
    full_width?: boolean;
  };
};

export type Block<T extends BlockType = BlockType> = {
  id: string;
  type: T;
  position: number;
  hidden: boolean;
  data: BlockData[T];
};

export const BLOCK_LIBRARY: { type: BlockType; label: string; icon: string }[] = [
  { type: "hero", label: "Hero", icon: "Sparkles" },
  { type: "heading", label: "Encabezado", icon: "Heading2" },
  { type: "paragraph", label: "Texto enriquecido", icon: "Type" },
  { type: "image", label: "Imagen", icon: "Image" },
  { type: "gallery", label: "Galería", icon: "Images" },
  { type: "columns", label: "Columnas", icon: "Columns3" },
  { type: "cards", label: "Cards", icon: "LayoutGrid" },
  { type: "embed", label: "Vídeo / Embed", icon: "Youtube" },
  { type: "button", label: "Botón", icon: "Square" },
  { type: "cta", label: "CTA destacado", icon: "MousePointerClick" },
  { type: "quote", label: "Cita", icon: "Quote" },
  { type: "divider", label: "Separador", icon: "Minus" },
  { type: "form_embed", label: "Formulario", icon: "ClipboardList" },
];

export function defaultDataFor(type: BlockType): BlockData[BlockType] {
  switch (type) {
    case "heading": return { level: 2, text: "Nuevo encabezado", align: "left" };
    case "paragraph": return { html: "<p>Escribe aquí…</p>" };
    case "image": return { url: "", alt: "", caption: "", width: "content" };
    case "embed": return { url: "", aspect: "16/9" };
    case "cta": return { label: "Botón", href: "/", variant: "primary", align: "left" };
    case "divider": return {};
    case "quote": return { html: "<p>Cita inspiradora</p>", attribution: "" };
    case "form_embed": return { formSlug: "" };
    case "hero": return { title: "Título del hero", subtitle: "", image_url: "", overlay_opacity: 0.45, cta_label: "", cta_href: "", cta_variant: "primary", align: "center" };
    case "columns": return { count: 2, items: [{ html: "<p>Columna 1</p>" }, { html: "<p>Columna 2</p>" }] };
    case "gallery": return { images: [], columns: 3, lightbox: true };
    case "cards": return { items: [{ title: "Card 1", body: "Descripción", image_url: "" }, { title: "Card 2", body: "Descripción", image_url: "" }], columns: 2 };
    case "button": return { label: "Botón", href: "/", variant: "primary", size: "md", align: "left", full_width: false };
  }
}
