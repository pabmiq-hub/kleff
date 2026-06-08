import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, getUserIdDocument } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LayoutGrid, List, Search, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/members")({
  component: MembersPage,
});

interface MemberRow {
  id: string;
  member_number: number;
  username: string;
  full_name: string;
  avatar_url: string | null;
  date_of_birth: string;
  gender: string;
  email: string | null;
  roles: string[];
  created_at: string;
}

function formatMemberNumber(n: number) {
  return `K-${String(n).padStart(4, "0")}`;
}

function MembersPage() {
  const listFn = useServerFn(listUsers);
  const getDniFn = useServerFn(getUserIdDocument);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "cards">("list");
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  useEffect(() => {
    void listFn({ data: undefined as never })
      .then((r) => setMembers(r.users as MemberRow[]))
      .finally(() => setLoading(false));
  }, [listFn]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        formatMemberNumber(m.member_number).toLowerCase().includes(q),
    );
  }, [members, query]);

  const handleRevealDni = async (userId: string) => {
    try {
      const r = await getDniFn({ data: { userId } });
      setRevealed((prev) => ({ ...prev, [userId]: r.idDocument ?? "—" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Socios</h1>
          <p className="text-cream/60 mt-1">{members.length} socios registrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/50" />
            <Input
              placeholder="Buscar por nombre, número, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-64 bg-cream/5 border-cream/20 text-cream placeholder:text-cream/40"
            />
          </div>
          <div className="flex border border-cream/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-coral text-cream" : "text-cream/60 hover:bg-cream/10"}`}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`p-2 ${view === "cards" ? "bg-coral text-cream" : "text-cream/60 hover:bg-cream/10"}`}
              aria-label="Vista tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="text-cream/60">Cargando socios…</p>
      ) : view === "list" ? (
        <div className="bg-cream/5 border border-cream/15 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream/10 text-cream/70 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Nº</th>
                <th className="text-left px-4 py-3">Socio</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Nacimiento</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Alta</th>
                <th className="text-left px-4 py-3">DNI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-cream/10 hover:bg-cream/5">
                  <td className="px-4 py-3 font-mono text-coral font-semibold">{formatMemberNumber(m.member_number)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border border-cream/20" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-coral/30 flex items-center justify-center font-bold text-cream">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {m.full_name}
                          {m.roles.includes("super_admin") && (
                            <span className="ml-2 text-[10px] bg-coral text-cream px-1.5 py-0.5 rounded font-bold align-middle">ADMIN</span>
                          )}
                        </p>
                        <p className="text-xs text-cream/50">@{m.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-cream/70">{m.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-cream/70">{m.date_of_birth}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-cream/70">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {revealed[m.id] ? (
                      <code className="text-xs bg-cream/10 rounded px-2 py-1 border border-cream/20">{revealed[m.id]}</code>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-cream/70 hover:text-cream hover:bg-cream/10" onClick={() => handleRevealDni(m.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-cream/50">Sin resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-cream/5 border border-cream/15 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover border-2 border-coral" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-coral/30 flex items-center justify-center font-bold text-cream text-xl">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-coral text-xs font-bold">{formatMemberNumber(m.member_number)}</p>
                  <p className="font-semibold truncate">{m.full_name}</p>
                  <p className="text-xs text-cream/50 truncate">@{m.username}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-cream/70">
                <p className="truncate">{m.email}</p>
                <p>Nacimiento: {m.date_of_birth}</p>
                <p>Alta: {new Date(m.created_at).toLocaleDateString()}</p>
                {m.roles.includes("super_admin") && (
                  <span className="inline-block mt-1 text-[10px] bg-coral text-cream px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-cream/10">
                {revealed[m.id] ? (
                  <code className="block text-xs bg-cream/10 rounded px-2 py-1 border border-cream/20">DNI: {revealed[m.id]}</code>
                ) : (
                  <Button size="sm" variant="ghost" className="text-cream/70 hover:text-cream hover:bg-cream/10 w-full" onClick={() => handleRevealDni(m.id)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Ver DNI
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-cream/50 py-8">Sin resultados.</p>
          )}
        </div>
      )}
    </div>
  );
}
