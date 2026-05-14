import { Triangle, Heart, Square, Archive, Package } from "lucide-react";

export type ShelfLocation = "1" | "2" | "3" | "4" | "on_demand" | "drawer";
export type ShelfShape = "triangle" | "heart" | "square";
export type DrawerLetter = "a" | "b" | "c" | "d";

export interface LocationFields {
  shelf: ShelfLocation | null;
  shape: ShelfShape | null;
  slot_number: number | null;
  drawer_number: number | null;
  drawer_letter: DrawerLetter | null;
}

const SHELF_COLOR: Record<string, string> = {
  "1": "bg-amber-400 text-ink border-ink",
  "2": "bg-emerald-400 text-ink border-ink",
  "3": "bg-sky-400 text-ink border-ink",
  "4": "bg-fuchsia-400 text-ink border-ink",
  drawer: "bg-cream-deep text-ink border-ink",
  on_demand: "bg-ink text-cream border-ink",
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

export function describeLocation(loc: LocationFields): string {
  if (!loc.shelf) return "Ubicación no definida";
  if (loc.shelf === "on_demand") return "Bajo pedido — no está en la ludoteca fija, se puede pedir para próximos eventos";
  if (loc.shelf === "drawer") {
    const n = loc.drawer_number ?? "?";
    const l = loc.drawer_letter ?? "?";
    return `Cajón ${n}${l.toUpperCase()}`;
  }
  const shape = loc.shape ? SHAPE_LABEL[loc.shape] : "—";
  const slot = loc.slot_number ?? "?";
  return `Estantería ${loc.shelf} · ${shape} · posición ${slot}`;
}

export function LocationBadge({ loc, size = "sm" }: { loc: LocationFields; size?: "sm" | "md" }) {
  const small = size === "sm";
  const text = small ? "text-[10px]" : "text-xs";
  const pad = small ? "px-1.5 py-0.5" : "px-2 py-1";
  const icon = small ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const tooltip = describeLocation(loc);

  if (!loc.shelf) {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border ${pad} ${text} font-bold uppercase tracking-wider bg-cream-deep text-foreground/50 border-ink/20`}
      >
        ?
      </span>
    );
  }

  if (loc.shelf === "on_demand") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider ${SHELF_COLOR.on_demand}`}
      >
        <Package className={icon} /> Bajo pedido
      </span>
    );
  }

  if (loc.shelf === "drawer") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider ${SHELF_COLOR.drawer}`}
      >
        <Archive className={icon} /> C{loc.drawer_number ?? "?"}·{(loc.drawer_letter ?? "?").toUpperCase()}
      </span>
    );
  }

  const cls = SHELF_COLOR[loc.shelf];
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider ${cls}`}
    >
      {loc.shape ? <ShapeIcon shape={loc.shape} className={icon} /> : null}
      E{loc.shelf}·{loc.slot_number ?? "?"}
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
          <LocationBadge loc={{ shelf: "1", shape: "triangle", slot_number: 3, drawer_number: null, drawer_letter: null }} />
          Estantería 1, forma triángulo, posición 3
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
        Cada juego lleva un chip de color: el número indica la estantería, el icono la forma del separador y la cifra la posición. Los cajones usan número (1-4) + letra (A-D).
      </p>
    </div>
  );
}
