import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInvitation, listInvitations, revokeInvitation } from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invitations")({
  component: InvitationsPage,
});

interface Invitation {
  id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function InvitationsPage() {
  const createFn = useServerFn(createInvitation);
  const listFn = useServerFn(listInvitations);
  const revokeFn = useServerFn(revokeInvitation);

  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Invitation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const refresh = async () => {
    const r = await listFn({ data: undefined as never });
    setItems(r.invitations as Invitation[]);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await createFn({ data: { email } });
      setLastUrl(r.inviteUrl);
      setEmail("");
      await refresh();
      toast.success("Invitación creada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeFn({ data: { id } });
      await refresh();
      toast.success("Invitación revocada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold">Invitaciones</h1>
        <p className="text-cream/60 mt-1">Invita a nuevos socios al club.</p>
      </header>

      <form onSubmit={handleCreate} className="bg-cream/5 border border-cream/15 rounded-2xl p-6 space-y-3">
        <h2 className="font-display font-bold text-xl">Invitar a alguien</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[240px] space-y-1">
            <Label htmlFor="email" className="text-cream/80">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-cream/10 border-cream/20 text-cream placeholder:text-cream/40"
            />
          </div>
          <Button type="submit" disabled={submitting} className="bg-coral hover:bg-coral-deep text-cream">
            {submitting ? "Enviando…" : "Crear invitación"}
          </Button>
        </div>
        {lastUrl && (
          <div className="bg-coral/15 border border-coral/40 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-1">Enlace de invitación (cópialo y envíaselo):</p>
            <code className="block break-all text-xs bg-ink/50 rounded px-2 py-1 text-cream">{lastUrl}</code>
            <p className="text-xs text-cream/60 mt-1">En la próxima iteración este enlace se enviará por email automáticamente.</p>
          </div>
        )}
      </form>

      <div className="bg-cream/5 border border-cream/15 rounded-2xl p-6">
        <h2 className="font-display font-bold text-xl mb-4">Historial</h2>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-cream/50">Sin invitaciones todavía.</p>}
          {items.map((inv) => {
            const status = inv.revoked_at
              ? "Revocada"
              : inv.accepted_at
                ? "Aceptada"
                : new Date(inv.expires_at) < new Date()
                  ? "Caducada"
                  : "Pendiente";
            return (
              <div key={inv.id} className="flex items-center justify-between border-b border-cream/10 py-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{inv.email}</p>
                  <p className="text-xs text-cream/50">
                    {status} · creada {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                {status === "Pendiente" && (
                  <Button variant="ghost" size="sm" className="text-cream/70 hover:text-cream hover:bg-cream/10" onClick={() => handleRevoke(inv.id)}>
                    Revocar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
