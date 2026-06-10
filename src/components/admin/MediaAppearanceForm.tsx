import { useState, useMemo, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  adminCreateMediaAppearance,
  adminUpdateMediaAppearance,
  adminDeleteMediaAppearance,
  type MediaAppearance,
} from "@/lib/media-appearances.functions";
import { uploadMedia } from "@/lib/media.functions";
import { MediaCard } from "@/components/pages/MediaPage";

const MONTH_LABELS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

type Props = {
  initial?: MediaAppearance | null;
};

export function MediaAppearanceForm({ initial }: Props) {
  const navigate = useNavigate();
  const createFn = useServerFn(adminCreateMediaAppearance);
  const updateFn = useServerFn(adminUpdateMediaAppearance);
  const deleteFn = useServerFn(adminDeleteMediaAppearance);
  const uploadFn = useServerFn(uploadMedia);

  const now = new Date();
  const [url, setUrl] = useState(initial?.url ?? "");
  const [outlet, setOutlet] = useState(initial?.outlet ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [month, setMonth] = useState<number>(initial?.month ?? now.getMonth() + 1);
  const [year, setYear] = useState<number>(initial?.year ?? now.getFullYear());
  const [dateLabel, setDateLabel] = useState(initial?.dateLabel ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const autoDateLabel = `${MONTH_LABELS[month - 1]} ${year}`;
  const effectiveDateLabel = dateLabel || autoDateLabel;

  const previewItem: MediaAppearance = useMemo(
    () => ({
      id: initial?.id ?? "preview",
      url: url || "#",
      outlet: outlet || "MEDIO",
      title: title || "Título de la publicación",
      description: description || null,
      imageUrl: imageUrl || null,
      dateLabel: effectiveDateLabel,
      year,
      month,
      displayOrder: 0,
      isPublished,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: initial?.updatedAt ?? new Date().toISOString(),
    }),
    [url, outlet, title, description, imageUrl, effectiveDateLabel, year, month, isPublished, initial],
  );

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 8 MB)");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const res = await uploadFn({
        data: { fileName: file.name, contentType: file.type || "image/jpeg", base64 },
      });
      setImageUrl(res.url);
      toast.success("Imagen subida");
    } catch (err) {
      toast.error("Error al subir la imagen: " + (err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!url || !outlet || !title) {
      toast.error("Faltan campos obligatorios (URL, medio, título)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        url,
        outlet,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        dateLabel: dateLabel || autoDateLabel,
        year,
        month,
        isPublished,
      };
      if (initial) {
        await updateFn({ data: { id: initial.id, ...payload } });
        toast.success("Publicación actualizada");
      } else {
        const created = await createFn({ data: payload });
        toast.success("Publicación creada");
        void navigate({ to: "/admin/media/$id", params: { id: created.id } });
        return;
      }
    } catch (err) {
      toast.error("Error al guardar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm("¿Borrar esta publicación? No se puede deshacer.")) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { id: initial.id } });
      toast.success("Publicación borrada");
      void navigate({ to: "/admin/media" });
    } catch (err) {
      toast.error("Error al borrar: " + (err as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="month">Mes</Label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
            >
              {MONTH_LABELS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {i + 1} — {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="dateLabel">Etiqueta de fecha visible</Label>
          <Input
            id="dateLabel"
            value={dateLabel}
            onChange={(e) => setDateLabel(e.target.value)}
            placeholder={autoDateLabel}
            className="mt-1"
          />
          <p className="text-xs text-ink/60 mt-1">
            Por defecto se usa <strong>{autoDateLabel}</strong>. Puedes sobreescribirla
            (p. ej. «MAY 2026»).
          </p>
        </div>

        <div>
          <Label htmlFor="outlet">Medio</Label>
          <Input
            id="outlet"
            value={outlet}
            onChange={(e) => setOutlet(e.target.value)}
            placeholder="El Periódico · Qué hacer"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titular destacado"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Resumen (3-4 líneas)</Label>
          <Textarea
            id="description"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Resumen breve de la publicación…"
            className="mt-1"
          />
          <p className="text-xs text-ink/60 mt-1">{(description ?? "").length} / 600</p>
        </div>

        <div>
          <Label htmlFor="url">Enlace a la publicación</Label>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.elperiodico.com/…"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label>Imagen de cabecera</Label>
          <div className="mt-1 flex items-center gap-3">
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://… o sube una imagen"
            />
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-ink/20 bg-white px-3 py-2 text-sm hover:bg-ink/5">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Subir</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="vista previa"
              className="mt-3 max-h-40 rounded-md border border-ink/10"
              onError={(e) => ((e.currentTarget.style.opacity = "0.3"))}
            />
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
          <Label htmlFor="published" className="cursor-pointer">
            Publicado (visible en /medios)
          </Label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink/10">
          <Button onClick={handleSave} disabled={saving} className="bg-coral hover:bg-coral/90 text-ink">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {initial ? "Guardar cambios" : "Crear publicación"}
          </Button>
          {initial && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-700 hover:bg-red-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Borrar
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => void navigate({ to: "/admin/media" })}
            className="text-ink/70"
          >
            Cancelar
          </Button>
        </div>
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/60 mb-3">
            <Eye className="h-3.5 w-3.5" /> Previsualización (como se verá en /medios)
          </div>
          <div className="bg-cream-deep/40 border-2 border-ink/10 rounded-3xl p-5">
            <MediaCard item={previewItem} fallbackLabel="Ver publicación" />
          </div>
        </div>
      </aside>
    </div>
  );
}
