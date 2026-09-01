import { Triangle, Heart, Square, Circle, Star, Pentagon, Archive, Package, RotateCcw } from "lucide-react";
import { useAppLocale, type AppLocale } from "@/i18n/app-i18n";
import { rentalsDict } from "@/i18n/app/rentals";

export type ShelfLocation = "A" | "B" | "C" | "D" | "on_demand" | "drawer" | "restocking";
export type ShelfShape = "triangle" | "heart" | "square" | "circle" | "star" | "pentagon";
export type ShelfColor = "green" | "pink" | "red" | "yellow" | "blue" | "purple";
export type DrawerLetter = "a" | "b" | "c" | "d";

export interface LocationFields {
  shelf: ShelfLocation | string | null;
  shape: ShelfShape | null;
  slot_number: number | null;
  drawer_number: number | null;
  drawer_letter: DrawerLetter | null;
  shelf_color?: ShelfColor | null;
  in_drawer?: boolean | null;
}

const COLOR_BG: Record<ShelfColor, string> = {
  green: "bg-emerald-400 text-ink border-ink",
  pink: "bg-pink-400 text-ink border-ink",
  red: "bg-red-400 text-ink border-ink",
  yellow: "bg-amber-300 text-ink border-ink",
  blue: "bg-sky-400 text-ink border-ink",
  purple: "bg-purple-400 text-ink border-ink",
};

function ShapeIcon({ shape, className }: { shape: ShelfShape; className?: string }) {
  if (shape === "triangle") return <Triangle className={className} />;
  if (shape === "heart") return <Heart className={className} />;
  if (shape === "circle") return <Circle className={className} />;
  if (shape === "star") return <Star className={className} />;
  if (shape === "pentagon") return <Pentagon className={className} />;
  return <Square className={className} />;
}

// Normalize legacy numeric shelves (1-4) to A-D so old data still renders.
function normalizeShelf(s: string | null | undefined): string | null {
  if (!s) return null;
  const map: Record<string, string> = { "1": "A", "2": "B", "3": "C", "4": "D" };
  return map[s] ?? s;
}

export function describeLocation(loc: LocationFields, locale: AppLocale = "es"): string {
  const t = rentalsDict[locale].location;
  const shelf = normalizeShelf(loc.shelf as string | null);
  if (!shelf) return t.undefined;
  if (shelf === "on_demand") return t.onDemand;
  if (shelf === "restocking") return t.restocking;
  if (shelf === "drawer") {
    const n = loc.drawer_number ?? "?";
    const l = loc.drawer_letter ?? "?";
    return t.drawer(n, l);
  }
  if (loc.in_drawer) {
    const n = loc.drawer_number ?? "?";
    const l = loc.drawer_letter ?? "?";
    const shapeD = loc.shape ? t.shapeLabel[loc.shape] : "—";
    const colorD = loc.shelf_color ? t.colorSuffix(t.colorLabel[loc.shelf_color]) : "";
    return `${t.shelf(shelf, shapeD, colorD, "")} · ${t.drawer(n, l)}`.replace(/ · $/, "");
  }
  const shape = loc.shape ? t.shapeLabel[loc.shape] : "—";
  const slot = loc.slot_number ?? "?";
  const color = loc.shelf_color ? t.colorSuffix(t.colorLabel[loc.shelf_color]) : "";
  return t.shelf(shelf, shape, color, slot);
}

export function LocationBadge({ loc, size = "sm" }: { loc: LocationFields; size?: "sm" | "md" }) {
  const { locale } = useAppLocale();
  const t = rentalsDict[locale].location;
  const small = size === "sm";
  const text = small ? "text-[10px]" : "text-xs";
  const pad = small ? "px-1.5 py-0.5" : "px-2 py-1";
  const icon = small ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  const tooltip = describeLocation(loc, locale);
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
        <Package className={icon} /> {t.onDemandShort}
      </span>
    );
  }

  if (shelf === "restocking") {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider bg-amber-200 text-ink border-ink`}
      >
        <RotateCcw className={icon} /> {t.restockingShort}
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

  if (loc.in_drawer) {
    const clsD = loc.shelf_color ? COLOR_BG[loc.shelf_color] : "bg-cream-deep text-ink border-ink";
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center gap-1 rounded-full border-2 ${pad} ${text} font-bold uppercase tracking-wider ${clsD}`}
      >
        {shelf}
        {loc.shape ? <ShapeIcon shape={loc.shape} className={icon} /> : null}
        <Archive className={icon} />
        {loc.drawer_number ?? "?"}
        {(loc.drawer_letter ?? "?").toUpperCase()}
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
  const { locale } = useAppLocale();
  const t = rentalsDict[locale].location;
  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-cream-deep/40 p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-3">
        {t.legendTitle}
      </p>
      <div className="flex flex-wrap gap-3 text-xs text-foreground/75">
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "A", shape: "triangle", slot_number: 3, drawer_number: null, drawer_letter: null, shelf_color: "green" }} />
          {t.legendShelfExample}
        </span>
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "drawer", shape: null, slot_number: null, drawer_number: 2, drawer_letter: "a" }} />
          {t.legendDrawerExample}
        </span>
        <span className="inline-flex items-center gap-2">
          <LocationBadge loc={{ shelf: "on_demand", shape: null, slot_number: null, drawer_number: null, drawer_letter: null }} />
          {t.legendOnDemandExample}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-foreground/55">
        {t.legendFooter}
      </p>
    </div>
  );
}
