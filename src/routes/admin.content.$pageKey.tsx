import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Save, ImagePlus, Plus, Trash2, ExternalLink, History } from "lucide-react";
import { toast } from "sonner";
import { getPageSchema, withDefaults, type FieldType, type SectionSchema } from "@/cms/schemas";
import { adminGetSection, adminSaveSection } from "@/lib/content.functions";
import { uploadMedia } from "@/lib/media.functions";
import { optimizeToUploadPayload } from "@/lib/image-optimize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

export const Route = createFileRoute("/admin/content/$pageKey")({
  loader: ({ params }) => {
    const schema = getPageSchema(params.pageKey);
    if (!schema) throw notFound();
    return { schema };
  },
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-ink/70">Esta página no existe.</p>
      <Link to="/admin/content" className="text-coral hover:underline mt-4 inline-block">
        ← Volver
      </Link>
    </div>
  ),
  component: PageEditor,
});

function PageEditor() {
  const { schema } = Route.useLoaderData();
  const [activeKey, setActiveKey] = useState(schema.sections[0]?.key ?? "");
  const activeSection = schema.sections.find((s: SectionSchema) => s.key === activeKey) ?? schema.sections[0];

  return (
    <div className="space-y-6">
      <header>
        <Link to="/admin/content" className="text-ink/60 hover:text-ink text-sm inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Contenido
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold">{schema.label}</h1>
            <p className="text-ink/60 mt-1 font-mono text-sm">{schema.path}</p>
          </div>
          <a
            href={schema.path}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink/10 hover:bg-ink/15 rounded-lg text-sm"
          >
            Ver página <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <nav className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-ink/40 px-3 mb-2">Zonas editables</p>
          {schema.sections.map((s: SectionSchema) => (
            <button
              key={s.key}
              onClick={() => setActiveKey(s.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeKey === s.key
                  ? "bg-coral/20 text-coral"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {activeSection && <SectionEditor key={activeSection.key} section={activeSection} />}
      </div>
    </div>
  );
}

function SectionEditor({ section }: { section: SectionSchema }) {
  const get = useServerFn(adminGetSection);
  const save = useServerFn(adminSaveSection);
  const [content, setContent] = useState<Record<string, unknown>>(section.defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    get({ data: { sectionKey: section.key } })
      .then((r) => {
        if (cancelled) return;
        const stored = (r.section?.content ?? null) as Record<string, unknown> | null;
        setContent(withDefaults(section, stored));
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [section.key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({ data: { sectionKey: section.key, content, schemaVersion: 1 } });
      toast.success("Cambios guardados");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-ink/60">Cargando…</div>;
  }

  return (
    <div className="bg-ink/5 border border-ink/15 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">{section.label}</h2>
        {section.description && <p className="text-sm text-ink/60 mt-1">{section.description}</p>}
        <p className="text-xs font-mono text-ink/30 mt-1">{section.key}</p>
      </div>

      <div className="space-y-5">
        {Object.entries(section.fields).map(([fieldKey, field]) => (
          <FieldInput
            key={fieldKey}
            field={field}
            value={content[fieldKey]}
            onChange={(v) => setContent({ ...content, [fieldKey]: v })}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-ink/10">
        <Button onClick={handleSave} disabled={saving} className="bg-coral hover:bg-coral-deep text-ink">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldType;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.kind === "text" || field.kind === "url") {
    return (
      <div>
        <Label>{field.label}</Label>
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="mt-1.5"
        />
      </div>
    );
  }

  if (field.kind === "textarea") {
    return (
      <div>
        <Label>{field.label}</Label>
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 4}
          className="mt-1.5"
        />
      </div>
    );
  }

  if (field.kind === "image") {
    return <ImageField field={field} value={typeof value === "string" ? value : ""} onChange={onChange} />;
  }

  if (field.kind === "list") {
    const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
    return (
      <div>
        <Label>{field.label}</Label>
        <div className="mt-2 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="bg-ink/5 border border-ink/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
                  {field.itemLabel} #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...items];
                    next.splice(idx, 1);
                    onChange(next);
                  }}
                  className="p-1.5 text-ink/50 hover:text-red-300 hover:bg-red-500/10 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(field.fields).map(([k, sub]) => (
                  <FieldInput
                    key={k}
                    field={sub}
                    value={item[k]}
                    onChange={(v) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], [k]: v };
                      onChange(next);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const empty: Record<string, unknown> = {};
              for (const k of Object.keys(field.fields)) empty[k] = "";
              onChange([...items, empty]);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/60 hover:bg-ink/5 hover:text-ink"
          >
            <Plus className="h-4 w-4" /> Añadir {field.itemLabel.toLowerCase()}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function ImageField({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldType, { kind: "image" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const upload = useServerFn(uploadMedia);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 25 MB");
      return;
    }
    setUploading(true);
    try {
      const r = await upload({ data: await optimizeToUploadPayload(file) });
      onChange(r.url);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{field.label}</Label>
      {field.help && <p className="text-xs text-ink/50 mt-0.5">{field.help}</p>}
      <div className="mt-1.5 flex items-start gap-3">
        {value && (
          <img width={96} height={96} loading="lazy" decoding="async"
            src={getOptimizedImageUrl(value, { width: 192, height: 192 })}
            alt=""
            className="h-24 w-24 object-cover rounded-lg border border-ink/15"
          />
        )}
        <div className="flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de la imagen o sube una abajo"
          />
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-ink/10 hover:bg-ink/15 rounded-lg text-sm cursor-pointer">
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
