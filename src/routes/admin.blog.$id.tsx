import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, Trash2, ExternalLink, Languages } from "lucide-react";
import { toast } from "sonner";
import { adminGetBlogPost, adminUpdateBlogPost, adminDeleteBlogPost, adminTranslateBlogPostFromEs } from "@/lib/blog.functions";
import { RichTextEditor } from "@/components/cms/RichTextEditor";
import { ImagePicker } from "@/components/cms/ImagePicker";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({ meta: [{ title: "Editar post — Admin KLEFF" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: BlogPostEditor,
});

function BlogPostEditor() {
  const { id } = Route.useParams();
  const getPost = useServerFn(adminGetBlogPost);
  const router = useRouter();
  const updateFn = useServerFn(adminUpdateBlogPost);
  const deleteFn = useServerFn(adminDeleteBlogPost);
  const [state, setState] = useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPost({ data: { id } })
      .then((res) => {
        if (cancelled) return;
        setState(res.post as Record<string, unknown>);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, getPost]);

  if (loadError) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{loadError}</div>;
  if (!state) return <div className="p-6 text-ink/60 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando post…</div>;

  const get = (k: string) => (state[k] as string | null | undefined) ?? "";
  const set = (k: string, v: unknown) => setState((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: state.id as string,
          patch: {
            slug: state.slug as string,
            status: state.status as "draft" | "published",
            published_at: state.published_at as string,
            cover_image_url: (state.cover_image_url as string) || null,
            author_name: (state.author_name as string) || null,
            title_es: (state.title_es as string) || null,
            title_ca: (state.title_ca as string) || null,
            title_en: (state.title_en as string) || null,
            excerpt_es: (state.excerpt_es as string) || null,
            excerpt_ca: (state.excerpt_ca as string) || null,
            excerpt_en: (state.excerpt_en as string) || null,
            content_es: (state.content_es as string) || null,
            content_ca: (state.content_ca as string) || null,
            content_en: (state.content_en as string) || null,
            tags: (state.tags as string[]) ?? [],
          },
        },
      });
      toast.success("Post guardado");
      await router.invalidate();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este post definitivamente?")) return;
    try {
      await deleteFn({ data: { id: state.id as string } });
      toast.success("Post eliminado");
      router.navigate({ to: "/admin/blog" });
    } catch (e) { toast.error((e as Error).message); }
  };

  const isPublished = state.status === "published";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link to="/admin/blog" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Volver al blog</Link>
        <div className="flex items-center gap-3">
          <a href={`/${state.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-ink/70 hover:text-ink"><ExternalLink className="h-3.5 w-3.5" /> Vista pública</a>
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-ink/70 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar</Button>
        </div>
      </div>

      <section className="rounded-lg border border-ink/10 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-ink text-xs uppercase tracking-wider">Slug</Label>
            <Input value={get("slug")} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="bg-white border-ink/15 text-ink mt-1" />
          </div>
          <div>
            <Label className="text-ink text-xs uppercase tracking-wider">Autor</Label>
            <Input value={get("author_name")} onChange={(e) => set("author_name", e.target.value)} className="bg-white border-ink/15 text-ink mt-1" />
          </div>
          <div>
            <Label className="text-ink text-xs uppercase tracking-wider">Imagen de cabecera (URL)</Label>
            <Input value={get("cover_image_url")} onChange={(e) => set("cover_image_url", e.target.value)} className="bg-white border-ink/15 text-ink mt-1" placeholder="https://…" />
          </div>
          <div>
            <Label className="text-ink text-xs uppercase tracking-wider">Fecha publicación</Label>
            <Input type="datetime-local" value={(get("published_at") || "").slice(0, 16)} onChange={(e) => set("published_at", new Date(e.target.value).toISOString())} className="bg-white border-ink/15 text-ink mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Switch checked={isPublished} onCheckedChange={(v) => set("status", v ? "published" : "draft")} />
          <Label className="text-ink">{isPublished ? "Publicado" : "Borrador"}</Label>
        </div>
      </section>

      <Tabs defaultValue="es" className="w-full">
        <TabsList className="bg-ink/5 border border-ink/10">
          <TabsTrigger value="es">ES</TabsTrigger>
          <TabsTrigger value="ca">CA</TabsTrigger>
          <TabsTrigger value="en">EN</TabsTrigger>
        </TabsList>
        {(["es", "ca", "en"] as const).map((loc) => (
          <TabsContent key={loc} value={loc} className="space-y-4 mt-4">
            <div>
              <Label className="text-ink text-xs uppercase tracking-wider">Título ({loc.toUpperCase()})</Label>
              <Input value={get(`title_${loc}`)} onChange={(e) => set(`title_${loc}`, e.target.value)} className="bg-white border-ink/15 text-ink mt-1" />
            </div>
            <div>
              <Label className="text-ink text-xs uppercase tracking-wider">Extracto ({loc.toUpperCase()})</Label>
              <Textarea rows={2} value={get(`excerpt_${loc}`)} onChange={(e) => set(`excerpt_${loc}`, e.target.value)} className="bg-white border-ink/15 text-ink mt-1" />
            </div>
            <div>
              <Label className="text-ink text-xs uppercase tracking-wider mb-1 block">Contenido ({loc.toUpperCase()})</Label>
              <RichTextEditor
                value={get(`content_${loc}`)}
                onChange={(html) => set(`content_${loc}`, html)}
                placeholder="Escribe el contenido del post…"
                allowImages
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-coral hover:bg-coral/90">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar cambios
        </Button>
      </div>
    </div>
  );
}
