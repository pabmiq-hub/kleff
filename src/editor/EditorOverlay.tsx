import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  X,
  Save,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Trash2,
  ImagePlus,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "./EditorProvider";
import { InlineFormatToolbar } from "./Editable";
import type { StyleProps } from "./types";
import { uploadMedia } from "@/server/media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px", "60px", "72px", "96px"];
const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#FF6B5B", // coral
  "#FFB199",
  "#1a1a1a",
  "#f5e9d4", // cream
  "#dc2626",
  "#16a34a",
  "#2563eb",
];

export function EditorOverlay() {
  const { isSuperAdmin, editMode, toggleEditMode, hasDrafts, discardDrafts, publish, selected, setSelected } =
    useEditor();

  if (!isSuperAdmin) return null;

  return (
    <>
      {/* Floating activate button (visible to admins always) */}
      {!editMode && (
        <button
          onClick={toggleEditMode}
          className="fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 px-4 py-3 bg-coral hover:bg-coral-deep text-white rounded-full shadow-2xl font-medium"
          aria-label="Activar modo edición"
        >
          <Pencil className="h-4 w-4" /> Editar página
        </button>
      )}

      {/* Top bar — sólida, oscura, full width */}
      {editMode && (
        <div className="fixed top-0 left-0 right-0 z-[70] h-12 bg-[#1a1a1a] border-b border-black/20 text-white shadow-md">
          <div className="flex h-full items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <Pencil className="h-4 w-4 text-coral" />
              <span className="font-semibold">Modo edición</span>
              {hasDrafts && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-coral/20 text-coral text-xs">
                  Cambios sin publicar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={discardDrafts}
                disabled={!hasDrafts}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> Descartar
              </Button>
              <Button
                size="sm"
                onClick={publish}
                disabled={!hasDrafts}
                className="bg-coral hover:bg-coral-deep text-white"
              >
                <Save className="h-4 w-4 mr-1.5" /> Publicar
              </Button>
              <button
                onClick={toggleEditMode}
                className="ml-1 p-1.5 hover:bg-white/10 rounded"
                aria-label="Salir del modo edición"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side properties panel — siempre visible en modo edición (no flota sobre la página) */}
      {editMode && (
        <PropertiesPanel onClose={() => setSelected(null)} hasSelection={!!selected} />
      )}

      {/* Floating B/I/U toolbar that appears over the text selection */}
      {editMode && <InlineFormatToolbar />}
    </>
  );
}

function PropertiesPanel({ onClose, hasSelection }: { onClose: () => void; hasSelection: boolean }) {
  const { selected, overrides, setText, setImage, setStyle, setHidden, clearProperty } = useEditor();
  const upload = useServerFn(uploadMedia);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!selected) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 5 MB");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const r = await upload({
        data: { fileName: file.name, contentType: file.type || "application/octet-stream", base64 },
      });
      await setImage(selected.id, r.url);
      toast.success("Imagen actualizada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const ov = (selected ? overrides[selected.id] : undefined) ?? {};
  const style = (ov.style ?? {}) as StyleProps;

  return (
    <aside className="fixed top-12 right-0 bottom-0 w-[360px] z-[65] bg-white text-neutral-900 border-l border-neutral-200 shadow-[-4px_0_24px_rgba(0,0,0,0.08)] overflow-y-auto">
      <header className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
            {!hasSelection || !selected ? "Editor visual" : selected.kind === "image" ? "Imagen" : "Texto"}
          </p>
          <p className="font-mono text-xs text-neutral-400 truncate">
            {selected?.id ?? "Selecciona un elemento"}
          </p>
        </div>
        {hasSelection && (
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      {!hasSelection || !selected ? (
        <div className="p-6 text-center text-sm text-neutral-500">
          <Pencil className="h-8 w-8 mx-auto mb-3 text-neutral-300" />
          Haz clic en cualquier <strong>texto</strong> o <strong>imagen</strong> de la página para empezar a editarlo.
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {selected.kind === "text" && (
            <Section icon={<Type className="h-4 w-4" />} title="Contenido">
              <p className="text-[11px] text-neutral-500 mb-2 leading-snug">
                <strong>Doble clic</strong> sobre el texto en la página para editarlo en línea.
                Selecciona palabras y usa la barra flotante para <b>negrita</b>, <i>cursiva</i> o
                enlaces.
              </p>
              <Textarea
                value={ov.text ?? ""}
                onChange={(e) => void setText(selected.id, e.target.value)}
                placeholder="Texto (admite HTML básico: <b>, <i>, <u>, <a>)…"
                rows={4}
                className="bg-white border-neutral-300 text-neutral-900 font-mono text-xs"
              />
              {ov.text !== undefined && (
                <button
                  onClick={() => void clearProperty(selected.id, "text")}
                  className="text-xs text-neutral-500 hover:text-neutral-900 mt-1 inline-flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar texto original
                </button>
              )}
            </Section>
          )}

          {selected.kind === "image" && (
            <Section icon={<ImagePlus className="h-4 w-4" />} title="Imagen">
              <Input
                value={ov.src ?? ""}
                onChange={(e) => void setImage(selected.id, e.target.value)}
                placeholder="URL de la imagen"
                className="bg-white border-neutral-300"
              />
              <label className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm cursor-pointer text-neutral-800">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Subiendo…" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <div className="mt-3">
                <Label className="text-xs text-neutral-600">Texto alternativo</Label>
                <Input
                  value={ov.alt ?? ""}
                  onChange={(e) => void setImage(selected.id, ov.src ?? "", e.target.value)}
                  placeholder="Descripción de la imagen"
                  className="mt-1 bg-white border-neutral-300"
                />
              </div>
            </Section>
          )}

          {selected.kind === "text" && (
            <Section icon={<Type className="h-4 w-4" />} title="Tipografía">
              <Label className="text-xs text-neutral-600">Tamaño</Label>
              <select
                value={style.fontSize ?? ""}
                onChange={(e) => void setStyle(selected.id, { fontSize: e.target.value || undefined })}
                className="mt-1 w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-sm text-neutral-900"
              >
                <option value="">Por defecto</option>
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <ToggleBtn
                  active={style.fontWeight === "700"}
                  onClick={() =>
                    void setStyle(selected.id, {
                      fontWeight: style.fontWeight === "700" ? undefined : "700",
                    })
                  }
                >
                  <Bold className="h-3.5 w-3.5" /> Negrita
                </ToggleBtn>
                <select
                  value={style.textAlign ?? ""}
                  onChange={(e) =>
                    void setStyle(selected.id, {
                      textAlign: (e.target.value as StyleProps["textAlign"]) || undefined,
                    })
                  }
                  className="bg-white border border-neutral-300 rounded px-2 py-1.5 text-sm text-neutral-900"
                >
                  <option value="">Alineación</option>
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
            </Section>
          )}

          <Section icon={<Palette className="h-4 w-4" />} title="Colores">
            <ColorRow
              label={selected.kind === "text" ? "Color del texto" : "Color"}
              value={style.color}
              onChange={(c) => void setStyle(selected.id, { color: c })}
            />
            <ColorRow
              label="Fondo"
              value={style.backgroundColor}
              onChange={(c) => void setStyle(selected.id, { backgroundColor: c })}
            />
          </Section>

          <Section icon={<AlignCenter className="h-4 w-4" />} title="Espaciado">
            <div className="grid grid-cols-2 gap-2">
              <SpaceInput label="Padding sup." value={style.paddingTop} onChange={(v) => void setStyle(selected.id, { paddingTop: v })} />
              <SpaceInput label="Padding inf." value={style.paddingBottom} onChange={(v) => void setStyle(selected.id, { paddingBottom: v })} />
              <SpaceInput label="Margen sup." value={style.marginTop} onChange={(v) => void setStyle(selected.id, { marginTop: v })} />
              <SpaceInput label="Margen inf." value={style.marginBottom} onChange={(v) => void setStyle(selected.id, { marginBottom: v })} />
            </div>
          </Section>

          <Section icon={ov.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} title="Visibilidad">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void setHidden(selected.id, !ov.hidden)}
              className="w-full justify-start border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
            >
              {ov.hidden ? (
                <><Eye className="h-4 w-4 mr-2" /> Mostrar elemento</>
              ) : (
                <><EyeOff className="h-4 w-4 mr-2" /> Ocultar elemento</>
              )}
            </Button>
          </Section>

          {ov.style && (
            <button
              onClick={() => void clearProperty(selected.id, "style")}
              className="w-full text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center justify-center gap-1 py-2 border border-dashed border-neutral-300 rounded"
            >
              <Trash2 className="h-3 w-3" /> Restaurar estilos por defecto
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-neutral-600 font-semibold mb-2">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-sm border transition-colors ${
        active
          ? "bg-coral/10 border-coral text-coral"
          : "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (c: string | undefined) => void;
}) {
  return (
    <div className="mb-3">
      <Label className="text-xs text-neutral-600">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded border border-neutral-300 bg-white cursor-pointer"
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="—"
          className="flex-1 bg-white border-neutral-300 font-mono text-xs"
        />
        {value && (
          <button
            onClick={() => onChange(undefined)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900"
            aria-label="Quitar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="h-5 w-5 rounded border border-neutral-300"
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}

function SpaceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] text-neutral-600">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder="0px"
        className="mt-0.5 bg-white border-neutral-300 text-sm"
      />
    </div>
  );
}

