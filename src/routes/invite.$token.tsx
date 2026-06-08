import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { validateInvitation, acceptInvitation } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params }) => {
    const result = await validateInvitation({ data: { token: params.token } });
    return { invitation: result, token: params.token };
  },
  component: InvitePage,
});

function InvitePage() {
  const { invitation, token } = Route.useLoaderData();
  const navigate = useNavigate();
  const acceptFn = useServerFn(acceptInvitation);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    password: "",
    username: "",
    fullName: "",
    dateOfBirth: "",
    gender: "" as "" | "female" | "male" | "non_binary" | "other" | "prefer_not_to_say",
    idDocument: "",
  });

  if (!invitation.valid) {
    const reasonText: Record<string, string> = {
      not_found: "Esta invitación no existe.",
      revoked: "Esta invitación ha sido revocada.",
      used: "Esta invitación ya se ha utilizado.",
      expired: "Esta invitación ha caducado. Pide una nueva al equipo de KLEFF.",
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-deep px-4">
        <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile p-8 max-w-md text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Invitación no válida</h1>
          <p className="text-muted-foreground mb-6">{reasonText[invitation.reason]}</p>
          <Link to="/" className="text-coral-deep underline">Volver a la web</Link>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2MB");
      return;
    }
    setUploadingAvatar(true);
    // Use a temp folder + a random uuid; we'll move it on accept... or just leave it.
    // Simpler: use the email + random name (anonymous upload not allowed in policy).
    // Workaround: upload via a server function with service role
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/public/upload-invite-avatar?token=${encodeURIComponent(token)}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = (await res.json()) as { url: string };
      setAvatarUrl(json.url);
      toast.success("Foto subida");
    } catch {
      toast.error("Error al subir la foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.gender) {
      toast.error("Selecciona un género");
      return;
    }
    setSubmitting(true);
    try {
      await acceptFn({
        data: {
          token,
          password: form.password,
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          avatarUrl,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          idDocument: form.idDocument.trim().toUpperCase(),
        },
      });
      // Auto-login
      const { error } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: form.password,
      });
      if (error) throw error;
      toast.success("¡Bienvenido a KLEFF!");
      void navigate({ to: "/app" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear la cuenta";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-deep py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="block text-center mb-6">
          <span className="font-display font-bold text-2xl">KLEFF</span>
        </Link>

        <div className="bg-card border-2 border-ink rounded-2xl shadow-tactile p-6 sm:p-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">
            Crea tu cuenta
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Bienvenido a la zona privada de KLEFF. Esta cuenta será para <strong>{invitation.email}</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario *</Label>
                <Input
                  id="username"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.\-]+"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="ej. ada_lovelace"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Fecha de nacimiento *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Género *</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecciona…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Mujer</SelectItem>
                    <SelectItem value="male">Hombre</SelectItem>
                    <SelectItem value="non_binary">No binario</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefiero no decirlo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idDocument">Documento de identidad (DNI/NIE/Pasaporte) *</Label>
              <Input
                id="idDocument"
                required
                value={form.idDocument}
                onChange={(e) => setForm({ ...form, idDocument: e.target.value })}
                placeholder="12345678A"
              />
              <p className="text-xs text-muted-foreground">
                🔒 Cifrado de extremo a extremo. Solo el equipo administrador puede consultarlo, exclusivamente para emitir tu carnet de socio.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Foto de perfil</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatarUpload(f);
                }}
              />
              {avatarUrl && (
                <img src={avatarUrl} alt="" className="mt-2 h-20 w-20 rounded-full object-cover border-2 border-ink" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>

            <Button type="submit" disabled={submitting || uploadingAvatar} className="w-full">
              {submitting ? "Creando cuenta…" : "Crear cuenta y acceder"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
