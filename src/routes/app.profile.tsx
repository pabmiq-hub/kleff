import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const fetchProfile = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", gender: "" as any, avatarUrl: "" });

  useEffect(() => {
    void fetchProfile({ data: undefined as never })
      .then((r) => {
        if (r.profile) {
          setForm({
            fullName: r.profile.full_name,
            username: r.profile.username,
            gender: r.profile.gender,
            avatarUrl: r.profile.avatar_url ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [fetchProfile]);

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

  if (loading) return <p className="text-muted-foreground">Cargando…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold mb-6">Mi perfil</h1>
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
    </div>
  );
}
