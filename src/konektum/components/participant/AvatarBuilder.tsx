// @ts-nocheck
import { useMemo, useRef, useState } from "react";
import { Button } from "@/konektum/ui/button";
import { Badge } from "@/konektum/ui/badge";
import { Card } from "@/konektum/ui/card";
import { Dice5, Eraser, Pencil, Shapes, Sparkles, Trash2 } from "lucide-react";
import AvatarCanvas from "./AvatarCanvas";
import {
  AVATAR_CATEGORIES,
  DEFAULT_AVATAR,
  DRAWING_SLOTS,
  randomAvatar,
  suggestFromProfile,
  type AvatarLayers,
} from "@/konektum/lib/avatarPieces";

interface Props {
  lang: "es" | "en";
  initialLayers?: AvatarLayers | null;
  initialDrawing?: string | null;
  allowDrawing: boolean;
  prefillHints: string[];
  saving?: boolean;
  onSave: (layers: AvatarLayers, drawing: string | null) => void;
}

const DRAW_COLORS = ["#2B2B33", "#E85D6E", "#2ECC8F", "#4A6FA5", "#F2C14E", "#8E6BC7", "#F7C7A3"];
const DRAW_WIDTHS = [3, 6, 12, 20];

const AvatarBuilder = ({ lang, initialLayers, initialDrawing, allowDrawing, prefillHints, saving, onSave }: Props) => {
  const suggestions = useMemo(() => suggestFromProfile(prefillHints || []), [prefillHints]);

  const [layers, setLayers] = useState<AvatarLayers>(() => {
    if (initialLayers && Object.keys(initialLayers).length > 0) return { ...DEFAULT_AVATAR, ...initialLayers };
    const base = { ...DEFAULT_AVATAR };
    suggestFromProfile(prefillHints || []).forEach((s) => {
      base[s.category] = s.option;
    });
    return base;
  });
  const [activeCategory, setActiveCategory] = useState(AVATAR_CATEGORIES[1].id);
  const [mode, setMode] = useState<"pieces" | "draw">("pieces");
  const [drawing, setDrawing] = useState<string | null>(initialDrawing || null);
  const [drawSlot, setDrawSlot] = useState<string>(() => {
    const stored = initialLayers?.drawingSlot;
    return stored && stored !== "full" ? stored : DRAWING_SLOTS[0].id;
  });
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const [drawWidth, setDrawWidth] = useState(DRAW_WIDTHS[1]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const t = (es: string, en: string) => (lang === "en" ? en : es);
  const label = (o: { label_es: string; label_en: string }) => (lang === "en" ? o.label_en : o.label_es);

  const category = AVATAR_CATEGORIES.find((c) => c.id === activeCategory) || AVATAR_CATEGORIES[0];

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pos(e);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) setDrawing(canvas.toDataURL("image/png"));
  };

  const clearDraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawing(null);
  };

  const previewLayers: AvatarLayers = { ...layers, drawingSlot: drawing ? drawSlot : "full" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <Card className="p-3 shrink-0">
          <AvatarCanvas layers={previewLayers} drawing={drawing} size={148} animate />
        </Card>
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h3 className="font-semibold text-lg">{t("Construye tu avatar", "Build your avatar")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Elige las piezas que te representen. Luego el resto de tu mesa tendrá que adivinar cuál eres.",
              "Pick the pieces that represent you. Your table will then guess which one is you.",
            )}
          </p>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t("Sugerido por tus respuestas:", "Suggested from your answers:")}
              </span>
              {suggestions.map((s) => (
                <Badge key={`${s.category}-${s.option}`} variant="secondary" className="text-xs">
                  {lang === "en" ? s.reason_en : s.reason_es}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 justify-center sm:justify-start pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setLayers(randomAvatar())}>
              <Dice5 className="w-4 h-4 mr-1.5" />
              {t("Aleatorio", "Random")}
            </Button>
            {allowDrawing && (
              <Button
                type="button"
                variant={mode === "draw" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode(mode === "draw" ? "pieces" : "draw")}
              >
                {mode === "draw" ? <Shapes className="w-4 h-4 mr-1.5" /> : <Pencil className="w-4 h-4 mr-1.5" />}
                {mode === "draw" ? t("Usar piezas", "Use pieces") : t("Dibujar accesorio", "Draw accessory")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {mode === "pieces" ? (
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {AVATAR_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={c.id === activeCategory ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setActiveCategory(c.id)}
              >
                {label(c)}
              </Button>
            ))}
          </div>

          <div className={category.kind === "color" ? "flex flex-wrap gap-2" : "grid grid-cols-3 sm:grid-cols-4 gap-2"}>
            {category.options.map((o) => {
              const selected = layers[category.id] === o.id;
              if (category.kind === "color") {
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-label={label(o)}
                    onClick={() => setLayers({ ...layers, [category.id]: o.id })}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${
                      selected ? "border-primary scale-110" : "border-border"
                    }`}
                    style={{ backgroundColor: o.color || "transparent" }}
                  >
                    {!o.color && <Eraser className="w-4 h-4 mx-auto text-muted-foreground" />}
                  </button>
                );
              }
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setLayers({ ...layers, [category.id]: o.id })}
                  className={`rounded-xl border-2 p-1 bg-card transition-colors ${
                    selected ? "border-primary" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <AvatarCanvas layers={{ ...layers, [category.id]: o.id }} size={72} className="mx-auto" />
                  <span className="block text-[11px] text-muted-foreground truncate">{label(o)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            {t(
              "Dibuja un accesorio (gorro, mascota, objeto…) y elige dónde colocarlo en tu avatar.",
              "Draw an accessory (a hat, a pet, an object…) and choose where to place it on your avatar.",
            )}
          </p>
          <canvas
            ref={(el) => {
              canvasRef.current = el;
              if (el && !el.dataset.ready) {
                el.dataset.ready = "1";
                const ctx = el.getContext("2d");
                if (ctx && initialDrawing) {
                  const img = new Image();
                  img.onload = () => ctx.drawImage(img, 0, 0, el.width, el.height);
                  img.src = initialDrawing;
                }
              }
            }}
            width={400}
            height={400}
            className="w-full max-w-xs mx-auto aspect-square rounded-2xl border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] touch-none"
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {DRAW_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => setDrawColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${drawColor === c ? "border-primary scale-110" : "border-border"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <span className="w-px h-6 bg-border mx-1" />
            {DRAW_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                aria-label={`${w}px`}
                onClick={() => setDrawWidth(w)}
                className={`w-8 h-8 rounded-full border-2 grid place-items-center ${
                  drawWidth === w ? "border-primary" : "border-border"
                }`}
              >
                <span className="rounded-full bg-foreground" style={{ width: w / 1.5, height: w / 1.5 }} />
              </button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={clearDraw}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              {t("Borrar", "Clear")}
            </Button>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("¿Dónde lo colocamos?", "Where should it go?")}</p>
            <div className="flex flex-wrap gap-1.5">
              {DRAWING_SLOTS.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  variant={drawSlot === s.id ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setDrawSlot(s.id)}
                >
                  {lang === "en" ? s.label_en : s.label_es}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button className="w-full" disabled={saving} onClick={() => onSave(previewLayers, drawing)}>
        {saving ? t("Guardando…", "Saving…") : t("Guardar mi avatar", "Save my avatar")}
      </Button>

    </div>
  );
};

export default AvatarBuilder;
