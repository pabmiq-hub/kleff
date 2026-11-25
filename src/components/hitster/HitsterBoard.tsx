import { X } from "lucide-react";
import { HITSTER_COLOR_STYLES, hasBingoLine, type HitsterColor } from "@/lib/hitster";

interface HitsterBoardProps {
  board: HitsterColor[];
  marks: boolean[];
  /** Highlights cells of this color and allows clicking unmarked ones (normal play). */
  activeColor?: HitsterColor | null;
  canMark?: boolean;
  /** Allows clicking marked cells to remove a cross (exact-year rival punishment). */
  punishMode?: boolean;
  onCellClick?: (index: number) => void;
  size?: "sm" | "md";
}

export function HitsterBoard({
  board,
  marks,
  activeColor = null,
  canMark = false,
  punishMode = false,
  onCellClick,
  size = "md",
}: HitsterBoardProps) {
  const winLine = new Set(hasBingoLine(marks) ?? []);
  const isSmall = size === "sm";

  return (
    <div className={`grid grid-cols-5 ${isSmall ? "gap-1" : "gap-2"}`}>
      {board.map((color, idx) => {
        const st = HITSTER_COLOR_STYLES[color];
        const marked = marks[idx] === true;
        const isWin = winLine.has(idx);
        const selectableMark = canMark && activeColor === color && !marked;
        const selectablePunish = punishMode && marked;
        const clickable = Boolean(onCellClick && (selectableMark || selectablePunish));
        const dimmed = Boolean(activeColor && canMark && activeColor !== color && !marked);

        return (
          <button
            key={idx}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onCellClick?.(idx)}
            aria-label={`Casilla ${idx + 1} ${color}${marked ? " marcada" : ""}`}
            className={[
              "relative aspect-square rounded-lg border-2 flex items-center justify-center transition-all select-none",
              st.bg,
              isWin ? "border-foreground ring-2 ring-foreground/60" : "border-white/30",
              dimmed ? "opacity-35" : "opacity-100",
              selectableMark ? "ring-2 ring-offset-2 ring-foreground animate-pulse cursor-pointer scale-[1.03]" : "",
              selectablePunish ? "ring-2 ring-offset-1 ring-destructive cursor-pointer hover:scale-105" : "",
              !clickable ? "cursor-default" : "",
            ].join(" ")}
          >
            {marked && (
              <span className="flex items-center justify-center rounded-full bg-black/55 text-white p-1 shadow-sm">
                <X className={isSmall ? "h-3 w-3 stroke-[3]" : "h-6 w-6 stroke-[3]"} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}