import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListAccessUsers,
  adminCreateAccessUser,
  adminSetAccessUserActive,
  adminSetAccessUserPassword,
  adminSetUserPermissions,
  adminDeleteAccessUser,
  adminListRegistrationOptions,
  type AccessUser,
} from "@/lib/permissions.functions";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [{ title: "Usuarios y permisos — Admin KLEFF" }, { name: "robots", content: "noindex" }],
  }),
  component: UsuariosPage,
});

type PermisoDraft = {
  finanzas: "" | "lectura" | "escritura";
  konektum: boolean;
  blog: boolean;
  inscripciones: string[];
};

const EMPTY_DRAFT: PermisoDraft = { finanzas: "", konektum: false, blog: false, inscripciones: [] };

const draftToPermisos = (d: PermisoDraft) => [
  ...(d.finanzas ? [{ recurso: "finanzas" as const, nivel: d.finanzas }] : []),
  ...(d.konektum ? [{ recurso: "konektum" as const, nivel: "completo" as const }] : []),
  ...(d.blog ? [{ recurso: "blog" as const, nivel: "completo" as const }] : []),
  ...d.inscripciones.map((id) => ({ recurso: "inscripcion" as const, nivel: "lectura" as const, recurso_id: id })),
];

function UsuariosPage() {
  const { isSuperAdmin, loading } = useAdminAccess();
  const navigate = useNavigate();

  const list = useServerFn(adminListAccessUsers);
  const create = useServerFn(adminCreateAccessUser);
  const setActive = useServerFn(adminSetAccessUserActive);
  const setPassword = useServerFn(adminSetAccessUserPassword);
  const setPerms = useServerFn(adminSetUserPermissions);
  const remove = useServerFn(adminDeleteAccessUser);
  const listForms = useServerFn(adminListRegistrationOptions);

  const [rows, setRows] = useState<AccessUser[]>([]);
  const [forms, setForms] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", nombre: "", password: "" });
  const [draft, setDraft] = useState<PermisoDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<AccessUser | null>(null);
  const [editDraft, setEditDraft] = useState<PermisoDraft>(EMPTY_DRAFT);
  const [pwFor, setPwFor] = useState<AccessUser | null>(null);
  const [pw, setPw] = useState("");

  const reload = useCallback(async () => {
    const [u, f] = await Promise.all([list(), listForms()]);
    setRows(u as AccessUser[]);
    setForms(f as { id: string; title: string; slug: string }[]);
  }, [list, listForms]);

  useEffect(() => {
    if (!loading && isSuperAdmin) void reload();
  }, [reload, loading, isSuperAdmin]);

  if (loading) return <p className="text-ink/60">Cargando…</p>;
  if (!isSuperAdmin) {
    void navigate({ to: "/admin" });
    return null;
  }

  const openEdit = (u: AccessUser) => {
    setEditing(u);
    setEditDraft({
      finanzas: (u.permisos.find((p) => p.recurso === "finanzas")?.nivel as "lectura" | "escritura") ?? "",
      konektum: u.permisos.some((p) => p.recurso === "konektum"),
      blog: u.permisos.some((p) => p.recurso === "blog"),
      inscripciones: u.permisos.filter((p) => p.recurso === "inscripcion" && p.recurso_id).map((p) => p.recurso_id as string),
    });
  };

  const randomPassword = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-bold">Usuarios y permisos</h1>
          <p className="text-ink/60 mt-1">
            Crea cuentas de acceso al panel y decide qué puede ver cada persona. No hay registro público.
          </p>
        </div>
        <Button onClick={() => { setForm({ email: "", nombre: "", password: randomPassword() }); setDraft(EMPTY_DRAFT); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Crear usuario de acceso
        </Button>
      </header>

      <div className="grid gap-3">
        {rows.map((u) => (
          <Card key={u.id}>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{u.nombre || u.email}</CardTitle>
                <p className="text-xs text-ink/60">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/60">{u.activo ? "Activo" : "Revocado"}</span>
                <Switch
                  checked={u.activo}
                  onCheckedChange={async (v) => {
                    await setActive({ data: { id: u.id, activo: v } });
                    await reload();
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-sm">
              {u.permisos.length === 0 && <span className="text-ink/60">Sin permisos asignados</span>}
              {u.permisos.map((p) => (
                <span key={p.id} className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold">
                  {p.recurso === "inscripcion"
                    ? `Inscripción: ${forms.find((f) => f.id === p.recurso_id)?.title ?? "—"}`
                    : p.recurso === "finanzas"
                      ? `Finanzas (${p.nivel === "escritura" ? "lectura y escritura" : "solo lectura"})`
                      : p.recurso === "konektum"
                        ? "Konektum"
                        : "Blog"}
                </span>
              ))}
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>
                  Editar permisos
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setPwFor(u); setPw(randomPassword()); }}>
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await remove({ data: { id: u.id } });
                    await reload();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-ink/60">Todavía no hay usuarios externos con acceso.</p>}
      </div>

      {/* Crear */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear usuario de acceso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Correo electrónico</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <Label>Contraseña</Label>
              <div className="flex gap-2">
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <Button variant="secondary" onClick={() => setForm({ ...form, password: randomPassword() })}>
                  Generar
                </Button>
              </div>
              <p className="text-xs text-ink/60 mt-1">Cópiala y compártela tú con la persona.</p>
            </div>
            <PermisosEditor draft={draft} setDraft={setDraft} forms={forms} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.email || form.password.length < 8}
              onClick={async () => {
                try {
                  await create({
                    data: {
                      email: form.email,
                      nombre: form.nombre || undefined,
                      password: form.password,
                      permisos: draftToPermisos(draft),
                    },
                  });
                  toast.success("Usuario creado");
                  setOpen(false);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo crear");
                }
              }}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar permisos */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permisos de {editing?.nombre || editing?.email}</DialogTitle>
          </DialogHeader>
          <PermisosEditor draft={editDraft} setDraft={setEditDraft} forms={forms} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!editing) return;
                try {
                  await setPerms({ data: { id: editing.id, permisos: draftToPermisos(editDraft) } });
                  toast.success("Permisos actualizados");
                  setEditing(null);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "No se pudo guardar");
                }
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contraseña */}
      <Dialog open={Boolean(pwFor)} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva contraseña</DialogTitle>
          </DialogHeader>
          <Input value={pw} onChange={(e) => setPw(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwFor(null)}>
              Cancelar
            </Button>
            <Button
              disabled={pw.length < 8}
              onClick={async () => {
                if (!pwFor) return;
                await setPassword({ data: { id: pwFor.id, password: pw } });
                toast.success("Contraseña actualizada");
                setPwFor(null);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermisosEditor({
  draft,
  setDraft,
  forms,
}: {
  draft: PermisoDraft;
  setDraft: (d: PermisoDraft) => void;
  forms: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-3 border-t border-ink/10 pt-3">
      <div>
        <Label>Finanzas</Label>
        <select
          className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm"
          value={draft.finanzas}
          onChange={(e) => setDraft({ ...draft, finanzas: e.target.value as PermisoDraft["finanzas"] })}
        >
          <option value="">Sin acceso</option>
          <option value="lectura">Solo lectura</option>
          <option value="escritura">Lectura y escritura</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.konektum}
          onChange={(e) => setDraft({ ...draft, konektum: e.target.checked })}
        />
        Konektum (acceso completo)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.blog} onChange={(e) => setDraft({ ...draft, blog: e.target.checked })} />
        Blog (acceso completo)
      </label>
      <div>
        <Label>Inscripciones concretas (solo ver inscritos)</Label>
        <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
          {forms.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.inscripciones.includes(f.id)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    inscripciones: e.target.checked
                      ? [...draft.inscripciones, f.id]
                      : draft.inscripciones.filter((x) => x !== f.id),
                  })
                }
              />
              {f.title}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
