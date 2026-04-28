import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, getUserIdDocument } from "@/server/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/users")({
  component: UsersPage,
});

interface UserRow {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  date_of_birth: string;
  gender: string;
  email: string | null;
  roles: string[];
  created_at: string;
}

function UsersPage() {
  const listFn = useServerFn(listUsers);
  const getDniFn = useServerFn(getUserIdDocument);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  useEffect(() => {
    void listFn({ data: undefined as never })
      .then((r) => setUsers(r.users as UserRow[]))
      .finally(() => setLoading(false));
  }, [listFn]);

  const handleRevealDni = async (userId: string) => {
    try {
      const r = await getDniFn({ data: { userId } });
      setRevealed((prev) => ({ ...prev, [userId]: r.idDocument ?? "—" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="bg-card border-2 border-ink rounded-2xl p-6 shadow-tactile-sm">
      <h2 className="font-display font-bold text-xl mb-4">Usuarios ({users.length})</h2>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="flex items-start gap-4 border-b border-border/60 pb-3 last:border-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-12 w-12 rounded-full border-2 border-ink object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary-soft border-2 border-ink flex items-center justify-center font-bold">
                {u.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {u.full_name} <span className="text-muted-foreground font-normal">@{u.username}</span>
                {u.roles.includes("super_admin") && (
                  <span className="ml-2 text-xs bg-coral text-cream px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <p className="text-xs text-muted-foreground">
                Nacimiento: {u.date_of_birth} · Género: {u.gender}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {revealed[u.id] ? (
                  <code className="text-xs bg-background rounded px-2 py-1 border">DNI: {revealed[u.id]}</code>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => handleRevealDni(u.id)}>
                    Ver DNI
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
