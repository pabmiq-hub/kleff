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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  // Spanish is the canonical/default copy; the legacy single-language title
  // mirrors title_es so old data keeps showing while admins add translations.
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? initial?.title ?? "");
  const [titleCa, setTitleCa] = useState(initial?.titleCa ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [descEs, setDescEs] = useState(initial?.descriptionEs ?? initial?.description ?? "");
  const [descCa, setDescCa] = useState(initial?.descriptionCa ?? "");
  const [descEn, setDescEn] = useState(initial?.descriptionEn ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [month, setMonth] = useState<number>(initial?.month ?? now.getMonth() + 1);
  const [year, setYear] = useState<number>(initial?.year ?? now.getFullYear());
  const [dateLabel, setDateLabel] = useState(initial?.dateLabel ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<"es" | "ca" | "en">("es");

  const autoDateLabel = `${MONTH_LABELS[month - 1]} ${year}`;
  const effectiveDateLabel = dateLabel || autoDateLabel;

  const previewItem: MediaAppearance = useMemo(() => {
    const t =
      previewLocale === "ca"
        ? titleCa || titleEs
        : previewLocale === "en"
          ? titleEn || titleEs
          : titleEs;
    const d =
      previewLocale === "ca"
        ? descCa || descEs
        : previewLocale === "en"
          ? descEn || descEs
          : descEs;
    return {
      id: initial?.id ?? "preview",
      url: url || "#",
      outlet: outlet || "MEDIO",
      title: t || "Título de la publicación",
      description: d || null,
      titleEs,
      titleCa,
      titleEn,
      descriptionEs: descEs || null,
      descriptionCa: descCa || null,
      descriptionEn: descEn || null,
      imageUrl: imageUrl || null,
      dateLabel: effectiveDateLabel,
      year,
      month,
      displayOrder: 0,
      isPublished,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: initial?.updatedAt ?? new Date().toISOString(),
    };
  }, [
    previewLocale,
    titleEs,
    titleCa,
    titleEn,
    descEs,
    descCa,
    descEn,
    url,
    outlet,
    imageUrl,
    effectiveDateLabel,
    year,
    month,
    isPublished,
    initial,
  ]);

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
    if (!url || !outlet || !titleEs) {
      toast.error("Faltan campos obligatorios (URL, medio, título en castellano)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        url,
        outlet,
        // legacy single-language fields mirror the Spanish copy
        title: titleEs,
        description: descEs || null,
        titleEs,
        titleCa: titleCa || null,
        titleEn: titleEn || null,
        descriptionEs: descEs || null,
        descriptionCa: descCa || null,
        descriptionEn: descEn || null,
        imageUrl: imageUrl || null,
        dateLabel: dateLabel || autoDateLabel,
        year,
        month,
        isPublished,
      };
      if (initial) {
        const updated = await updateFn({ data: { id: initial.id, ...payload } });
        // Re-sync local state with what the server stored, so admins can see
        // that their changes really persisted (and the form stays accurate).
        setUrl(updated.url);
        setOutlet(updated.outlet);
        setTitleEs(updated.titleEs ?? updated.title ?? "");
        setTitleCa(updated.titleCa ?? "");
        setTitleEn(updated.titleEn ?? "");
        setDescEs(updated.descriptionEs ?? updated.description ?? "");
        setDescCa(updated.descriptionCa ?? "");
        setDescEn(updated.descriptionEn ?? "");
        setImageUrl(updated.imageUrl ?? "");
        setDateLabel(updated.dateLabel ?? "");
        setYear(updated.year);
        setMonth(updated.month);
        setIsPublished(updated.isPublished);
        toast.success("Publicación actualizada");
      } else {
        const created = await createFn({ data: payload });
        toast.success("Publicación creada");
        void navigate({ to: "/admin/media/$id", params: { id: created.id } });
        return;
      }
    } catch (err) {
      console.error("[media] save failed", err);
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

        {/* Per-locale title and description */}
        <div className="border border-ink/10 rounded-lg p-4 bg-cream-deep/30">
          <Label className="text-xs uppercase tracking-wider text-ink/60">
            Título y resumen por idioma
          </Label>
          <Tabs defaultValue="es" className="mt-3">
            <TabsList className="bg-white">
              <TabsTrigger value="es">Castellano</TabsTrigger>
              <TabsTrigger value="ca">Català</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="es" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="title_es">Título</Label>
                <Input
                  id="title_es"
                  value={titleEs}
                  onChange={(e) => setTitleEs(e.target.value)}
                  placeholder="Titular destacado"
                  required
                />
              </div>
              <div>
                <Label htmlFor="desc_es">Resumen</Label>
                <Textarea
                  id="desc_es"
                  value={descEs}
                  onChange={(e) => setDescEs(e.target.value)}
                  rows={4}
                  maxLength={600}
                />
              </div>
            </TabsContent>
            <TabsContent value="ca" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="title_ca">Títol (català)</Label>
                <Input
                  id="title_ca"
                  value={titleCa}
                  onChange={(e) => setTitleCa(e.target.value)}
                  placeholder="Si es deixa buit, es mostrarà el títol en castellà."
                />
              </div>
              <div>
                <Label htmlFor="desc_ca">Resum (català)</Label>
                <Textarea
                  id="desc_ca"
                  value={descCa}
                  onChange={(e) => setDescCa(e.target.value)}
                  rows={4}
                  maxLength={600}
                />
              </div>
            </TabsContent>
            <TabsContent value="en" className="space-y-3 pt-3">
              <div>
                <Label htmlFor="title_en">Title (English)</Label>
                <Input
                  id="title_en"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="If left blank, the Spanish title will be shown."
                />
              </div>
              <div>
                <Label htmlFor="desc_en">Summary (English)</Label>
                <Textarea
                  id="desc_en"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  rows={4}
                  maxLength={600}
                />
              </div>
            </TabsContent>
          </Tabs>
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
          <div className="mb-3 inline-flex rounded-md border border-ink/15 bg-white p-0.5 text-xs">
            {(["es", "ca", "en"] as const).map((lc) => (
              <button
                key={lc}
                type="button"
                onClick={() => setPreviewLocale(lc)}
                className={`px-3 py-1 rounded ${
                  previewLocale === lc ? "bg-coral text-ink font-semibold" : "text-ink/60"
                }`}
              >
                {lc.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="bg-cream-deep/40 border-2 border-ink/10 rounded-3xl p-5">
            <MediaCard item={previewItem} fallbackLabel="Ver publicación" />
          </div>
        </div>
      </aside>
    </div>
  );
}
