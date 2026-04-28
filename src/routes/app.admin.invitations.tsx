import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createInvitation, listInvitations, revokeInvitation } from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/invitations")({
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

  useEffect(() => { void refresh(); }, []);

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
      <form onSubmit={handleCreate} className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm space-y-3">
        <h2 className="font-display font-bold text-xl">Invitar a alguien</h2>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={submitting} className="self-end">
            {submitting ? "Enviando…" : "Crear invitación"}
          </Button>
        </div>
        {lastUrl && (
          <div className="bg-primary-soft/30 border border-coral/40 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-1">Enlace de invitación (cópialo y envíaselo):</p>
            <code className="block break-all text-xs bg-background rounded px-2 py-1">{lastUrl}</code>
            <p className="text-xs text-muted-foreground mt-1">En la próxima iteración este enlace se enviará por email automáticamente.</p>
          </div>
        )}
      </form>

      <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
        <h2 className="font-display font-bold text-xl mb-4">Invitaciones</h2>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Sin invitaciones todavía.</p>}
          {items.map((inv) => {
            const status = inv.revoked_at ? "Revocada" : inv.accepted_at ? "Aceptada" : new Date(inv.expires_at) < new Date() ? "Caducada" : "Pendiente";
            return (
              <div key={inv.id} className="flex items-center justify-between border-b border-border/60 py-2">
                <div>
                  <p className="font-medium text-sm">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">{status} · creada {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                {status === "Pendiente" && (
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(inv.id)}>Revocar</Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
