import { Triangle, Heart, Square, Archive, Package } from "lucide-react";

export type ShelfLocation = "A" | "B" | "C" | "D" | "on_demand" | "drawer";
export type ShelfShape = "triangle" | "heart" | "square";
export type ShelfColor = "green" | "pink" | "red" | "yellow" | "blue";
export type DrawerLetter = "a" | "b" | "c" | "d";

export interface LocationFields {
  shelf: ShelfLocation | string | null;
  shape: ShelfShape | null;
  slot_number: number | null;
  drawer_number: number | null;
  drawer_letter: DrawerLetter | null;
  shelf_color?: ShelfColor | null;
}

const COLOR_BG: Record<ShelfColor, string> = {
  green: "bg-emerald-400 text-ink border-ink",
  pink: "bg-pink-400 text-ink border-ink",
  red: "bg-red-400 text-ink border-ink",
  yellow: "bg-amber-300 text-ink border-ink",
  blue: "bg-sky-400 text-ink border-ink",
};

export const COLOR_LABEL: Record<ShelfColor, string> = {
  green: "verde",
  pink: "rosa",
  red: "rojo",
  yellow: "amarillo",
  blue: "azul",
};

const SHAPE_LABEL: Record<ShelfShape, string> = {
  triangle: "triángulo",
  heart: "corazón",
  square: "cuadrado",
};

function ShapeIcon({ shape, className }: { shape: ShelfShape; className?: string }) {
  if (shape === "triangle") return <Triangle className={className} />;
  if (shape === "heart") return <Heart className={className} />;
  return <Square className={className} />;
}

// Normalize legacy numeric shelves (1-4) to A-D so old data still renders.
function normalizeShelf(s: string | null | undefined): string | null {
  if (!s) return null;
  const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
  return map[s] ?? s;
}

export function describeLocation(loc: LocationFields): string {
  const shelf = normalizeShelf(loc.shelf as string | null);
  if (!shelf) return "Ubicación no definida";
  if (shelf === "on_demand") return "Bajo pedido — no está en la ludoteca fija, se puede pedir para próximos eventos";
  if (shelf === "drawer") {
    const n = loc.drawer_number ?? "?";
    const l = loc.drawer_letter ?? "?";
    return `Cajón ${n}${l.toUpperCase()}`;
  }
  const shape = loc.shape ? SHAPE_LABEL[loc.shape] : "—";
  const slot = loc.slot_number ?? "?";
  const color = loc.shelf_color ? `, color ${COLOR_LABEL[loc.shelf_color]}` : "";
  return `Estantería ${shelf} · ${shape}${color} · nº ${slot}`;
}

export function LocationBadge({ loc, size = "sm" }: { loc: LocationFields; size?: "sm" | "md" }) {
  const small = size === "sm";
  const text = small ? "text-[10px]" : "text-xs";
  const pad = small ? "px-1.5 py-0.5" : "px-2 py-1";
  const icon = small ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const tooltip = describeLocation(loc);
  const shelf = normalizeShelf(loc.shelf as string | null);

  if (!shelf) {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border ${pad} ${text} font-bold uppercase tracking-wider bg-cream-deep text-foreground/50 border-ink/20`}
      >
        ?
      </span>
    );
  }

  if (shelf === "on_demand") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider bg-ink text-cream border-ink`}
      >
        <Package className={icon} /> Bajo pedido
      </span>
    );
  }

  if (shelf === "drawer") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider bg-cream-deep text-ink border-ink`}
      >
        <Archive className={icon} /> C{loc.drawer_number ?? "?"}·{(loc.drawer_letter ?? "?").toUpperCase()}
      </span>
    );
  }

  const cls = loc.shelf_color
    ? COLOR_BG[loc.shelf_color]
    : "bg-cream-deep text-ink border-ink";
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider ${cls}`}
    >
      {shelf}
      {loc.shape ? <ShapeIcon shape={loc.shape} className={icon} /> : null}
      {loc.slot_number ?? "?"}
    </span>
  );
}

export function LocationLegend() {
  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-cream-deep/40 p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-3">
        Cómo encontrar un juego
      </p>
      <div className="flex flex-wrap gap-3 text-xs text-foreground/75">
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "A", shape: "triangle", slot_number: 3, drawer_number: null, drawer_letter: null, shelf_color: "green" }} />
          Estantería A, forma triángulo, color verde, nº 3
        </span>
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "drawer", shape: null, slot_number: null, drawer_number: 2, drawer_letter: "a" }} />
          Cajón 2, letra A
        </span>
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "on_demand", shape: null, slot_number: null, drawer_number: null, drawer_letter: null }} />
          No está en la ludoteca fija — se puede pedir para próximos eventos
        </span>
      </div>
      <p className="mt-3 text-[11px] text-foreground/55">
        Cada juego lleva un chip de color: la letra indica la estantería (A-D), el icono la forma del separador, el color del chip el color del separador y la cifra la posición (1-5). Los cajones usan número (1-4) + letra (A-D).
      </p>
    </div>
  );
}
