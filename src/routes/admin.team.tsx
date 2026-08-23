import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListTeamMembers,
  adminUpsertTeamMember,
  adminDeleteTeamMember,
  type TeamMemberRow,
} from "@/lib/team.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImagePicker } from "@/components/cms/ImagePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VolunteerApplications } from "@/components/admin/VolunteerApplications";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

export const Route = createFileRoute("/admin/team")({
  head: () => ({ meta: [{ title: "Equipo — Admin KLEFF" }, { name: "robots", content: "noindex" }] }),
  component: TeamAdminPage,
});

type Draft = Omit<TeamMemberRow, "id"> & { id?: string };

const EMPTY: Draft = {
  name: "",
  emoji: "🎲",
  photo_url: null,
  favorite_game: "—",
  lucky_number: "—",
  sort_order: 0,
  active: true,
  role_es: "",
  role_ca: "",
  role_en: "",
  bio_es: "",
  bio_ca: "",
  bio_en: "",
  color_es: "—",
  color_ca: "—",
  color_en: "—",
};

function TeamAdminPage() {
  const list = useServerFn(adminListTeamMembers);
  const upsert = useServerFn(adminUpsertTeamMember);
  const del = useServerFn(adminDeleteTeamMember);
  const [rows, setRows] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setRows(await list());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () => {
    setEditing({ ...EMPTY, sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 10 });
    setOpen(true);
  };
  const startEdit = (r: TeamMemberRow) => {
    setEditing({ ...r });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      await upsert({ data: editing });
      toast.success("Guardado");
      setOpen(false);
      setEditing(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este miembro?")) return;
    try {
      await del({ data: { id } });
      toast.success("Eliminado");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-ink">Equipo</h1>
        <p className="text-ink/60 mt-1">
          Fichas públicas de <em>Quiénes somos</em> y solicitudes para el equipo de organización.
        </p>
      </div>

      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards">Fichas públicas</TabsTrigger>
          <TabsTrigger value="applications">Solicitudes</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <VolunteerApplications />
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={startNew} className="bg-coral text-cream hover:bg-coral/90">
          <Plus className="h-4 w-4 mr-2" /> Nuevo miembro
        </Button>
      </div>

      {loading ? (
        <p className="text-ink/60">Cargando…</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-4 bg-cream-deep/40 border border-ink/10 rounded-2xl p-3">
              <div className="size-14 rounded-full bg-cream border-2 border-ink flex items-center justify-center overflow-hidden shrink-0">
                {r.photo_url ? (
                  <img loading="lazy" decoding="async" src={getOptimizedImageUrl(r.photo_url, { width: 112, height: 112 })} alt={r.name} width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{r.emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-ink">{r.name}</span>
                  {!r.active && <span className="text-xs bg-ink/10 text-ink/60 px-2 py-0.5 rounded">Oculto</span>}
                </div>
                <div className="text-xs text-ink/60 truncate">{r.role_es}</div>
              </div>
              
              <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(r.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-ink/60">No hay miembros. Crea el primero.</p>}
        </div>
      )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar miembro" : "Nuevo miembro"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Foto de perfil</Label>
                <ImagePicker
                  url={editing.photo_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, photo_url: url || null })}
                  height="h-40"
                  label="Subir foto desde el dispositivo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editing.emoji}
                    onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Juego favorito</Label>
                  <Input
                    value={editing.favorite_game}
                    onChange={(e) => setEditing({ ...editing, favorite_game: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Número de la suerte</Label>
                  <Input
                    value={editing.lucky_number}
                    onChange={(e) => setEditing({ ...editing, lucky_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold text-sm mb-2">Título / Rol</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Español</Label>
                    <Input value={editing.role_es} onChange={(e) => setEditing({ ...editing, role_es: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Català</Label>
                    <Input value={editing.role_ca} onChange={(e) => setEditing({ ...editing, role_ca: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">English</Label>
                    <Input value={editing.role_en} onChange={(e) => setEditing({ ...editing, role_en: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold text-sm mb-2">Descripción (dorso de la card)</p>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Español</Label>
                    <Textarea rows={3} value={editing.bio_es} onChange={(e) => setEditing({ ...editing, bio_es: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Català</Label>
                    <Textarea rows={3} value={editing.bio_ca} onChange={(e) => setEditing({ ...editing, bio_ca: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">English</Label>
                    <Textarea rows={3} value={editing.bio_en} onChange={(e) => setEditing({ ...editing, bio_en: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="font-semibold text-sm mb-2">Color favorito</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Español</Label>
                    <Input value={editing.color_es} onChange={(e) => setEditing({ ...editing, color_es: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Català</Label>
                    <Input value={editing.color_ca} onChange={(e) => setEditing({ ...editing, color_ca: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">English</Label>
                    <Input value={editing.color_en} onChange={(e) => setEditing({ ...editing, color_en: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.active}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  />
                  <Label>Visible en la web</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={save} className="bg-coral text-cream hover:bg-coral/90">Guardar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
