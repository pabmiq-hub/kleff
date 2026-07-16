import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { linkLudoyaAccount, inviteMeToKleff } from "@/lib/ludoya.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const linkLudoyaFn = useServerFn(linkLudoyaAccount);
  const inviteMeFn = useServerFn(inviteMeToKleff);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", gender: "" as any, avatarUrl: "" });

  const [ludoyaUsername, setLudoyaUsername] = useState<string | null>(null);
  const [ludoyaInput, setLudoyaInput] = useState("");
  const [ludoyaBusy, setLudoyaBusy] = useState(false);

  const reload = () =>
    fetchProfile({ data: undefined as never }).then((r) => {
      if (r.profile) {
        setForm({
          fullName: r.profile.full_name,
          username: r.profile.username,
          gender: r.profile.gender,
          avatarUrl: r.profile.avatar_url ?? "",
        });
        setLudoyaUsername(r.profile.ludoya_username ?? null);
        setLudoyaInput(r.profile.ludoya_username ?? "");
      }
    });

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateFn({
        data: {
          fullName: form.fullName,
          username: form.username,
          gender: form.gender,
          avatarUrl: form.avatarUrl || null,
        },
      });
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkLudoya = async () => {
    const name = ludoyaInput.trim();
    if (!name) return;
    setLudoyaBusy(true);
    try {
      const r = await linkLudoyaFn({ data: { username: name } });
      if (r.linked) {
        setLudoyaUsername(r.user.username);
        setLudoyaInput(r.user.username);
        if (r.invite.status === "invited") {
          toast.success("Cuenta vinculada. Te hemos enviado una invitación al grupo de KLEFF en Ludoya.");
        } else if (r.invite.status === "already") {
          toast.success("Cuenta vinculada. Ya eres miembro del grupo de KLEFF.");
        } else if (r.invite.status === "not_found") {
          toast.warning("Cuenta vinculada pero Ludoya no encontró al usuario para invitarlo.");
        } else {
          toast.warning("Cuenta vinculada. No pudimos enviar la invitación al grupo (reintenta más tarde).");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLudoyaBusy(false);
    }
  };

  const handleUnlink = async () => {
    setLudoyaBusy(true);
    try {
      await linkLudoyaFn({ data: { username: null } });
      setLudoyaUsername(null);
      setLudoyaInput("");
      toast.success("Cuenta de Ludoya desvinculada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLudoyaBusy(false);
    }
  };

  const handleResendInvite = async () => {
    setLudoyaBusy(true);
    try {
      const r = await inviteMeFn({ data: undefined as never });
      if (r.status === "invited") toast.success("Invitación enviada");
      else if (r.status === "already") toast.info("Ya eres miembro del grupo");
      else if (r.status === "not_found") toast.error("Ludoya no encuentra tu usuario");
      else toast.error("No se pudo enviar (código " + r.httpStatus + ")");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLudoyaBusy(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Mi perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Nombre de usuario</Label>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Género</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Mujer</SelectItem>
              <SelectItem value="male">Hombre</SelectItem>
              <SelectItem value="non_binary">No binario</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefiero no decirlo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando…" : "Guardar"}</Button>
      </form>

      <section className="space-y-3 bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
        <header>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            Ludoya
            {ludoyaUsername && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          </h2>
          <p className="text-sm text-muted-foreground">
            Vincula tu cuenta de <a href="https://app.ludoya.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">Ludoya <ExternalLink className="h-3 w-3" /></a> para participar en el grupo de KLEFF y en las partidas del club.
          </p>
        </header>

        {ludoyaUsername ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Vinculado como</span>
              <a
                href={`https://app.ludoya.com/${ludoyaUsername}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-semibold underline"
              >
                @{ludoyaUsername}
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleResendInvite} disabled={ludoyaBusy}>
                Reenviar invitación al grupo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleUnlink} disabled={ludoyaBusy}>
                Desvincular
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ludoya">Tu usuario en Ludoya</Label>
              <Input
                id="ludoya"
                placeholder="tu_usuario"
                value={ludoyaInput}
                onChange={(e) => setLudoyaInput(e.target.value)}
                pattern="[a-zA-Z0-9_.\-]+"
              />
            </div>
            <Button type="button" onClick={handleLinkLudoya} disabled={ludoyaBusy || ludoyaInput.trim().length < 2}>
              {ludoyaBusy ? "Vinculando…" : "Vincular"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
