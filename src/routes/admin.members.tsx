import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, getUserIdDocument, setMemberDuesPaid, deleteMember } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberBadgesAdmin } from "@/components/admin/MemberBadgesAdmin";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { LayoutGrid, List, Search, Eye, CheckCircle2, XCircle, Mail, Calendar, User as UserIcon, IdCard, Shield, Sparkles, Trash2 } from "lucide-react";
import { adminGetMemberKarma } from "@/lib/karma-admin.functions";
import { levelForKarma, KARMA_ENTRY_STATUS_LABELS } from "@/lib/karma-levels";

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
  ludoya_username: string | null;
  dues_paid: boolean;
  dues_paid_at: string | null;
  dues_paid_by: string | null;
}

function formatMemberNumber(n: number) {
  return `K-${String(n).padStart(4, "0")}`;
}

interface MemberKarma {
  balance: number;
  lifetime: number;
  feeDiscountEuros: number;
  entries: {
    id: string;
    points: number;
    status: string;
    description: string | null;
    created_at: string;
    categoryName: string;
  }[];
}

function MembersPage() {
  const listFn = useServerFn(listUsers);
  const getDniFn = useServerFn(getUserIdDocument);
  const setDuesFn = useServerFn(setMemberDuesPaid);
  const deleteMemberFn = useServerFn(deleteMember);
  const [deleting, setDeleting] = useState(false);
  const memberKarmaFn = useServerFn(adminGetMemberKarma);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "cards">("list");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dni, setDni] = useState<string | null>(null);
  const [dniLoading, setDniLoading] = useState(false);
  const [savingDues, setSavingDues] = useState(false);
  const [karma, setKarma] = useState<MemberKarma | null>(null);
  const [karmaLoading, setKarmaLoading] = useState(false);
  const [showKarmaHistory, setShowKarmaHistory] = useState(false);

  const load = () => {
    setLoading(true);
    void listFn({ data: undefined as never })
      .then((r) => setMembers(r.users as MemberRow[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? null,
    [members, selectedId],
  );

  const openMember = (m: MemberRow) => {
    setSelectedId(m.id);
    setDni(null);
    setKarma(null);
    setShowKarmaHistory(false);
    setKarmaLoading(true);
    void memberKarmaFn({ data: { userId: m.id } })
      .then((r) => setKarma(r as MemberKarma))
      .catch(() => setKarma(null))
      .finally(() => setKarmaLoading(false));
  };

  const handleRevealDni = async () => {
    if (!selected) return;
    setDniLoading(true);
    try {
      const r = await getDniFn({ data: { userId: selected.id } });
      setDni(r.idDocument ?? "—");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setDniLoading(false);
    }
  };

  const handleToggleDues = async () => {
    if (!selected) return;
    setSavingDues(true);
    try {
      const next = !selected.dues_paid;
      await setDuesFn({ data: { userId: selected.id, paid: next } });
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selected.id
            ? { ...m, dues_paid: next, dues_paid_at: next ? new Date().toISOString() : null }
            : m,
        ),
      );
      toast.success(next ? "Cuota marcada como pagada" : "Cuota marcada como pendiente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingDues(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Socios</h1>
          <p className="text-ink/60 mt-1">{members.length} socios registrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/50" />
            <Input
              placeholder="Buscar por nombre, número, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 w-64 bg-ink/5 border-ink/20 text-ink placeholder:text-ink/40"
            />
          </div>
          <div className="flex border border-ink/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-coral text-ink" : "text-ink/60 hover:bg-ink/10"}`}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`p-2 ${view === "cards" ? "bg-coral text-ink" : "text-ink/60 hover:bg-ink/10"}`}
              aria-label="Vista tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="text-ink/60">Cargando socios…</p>
      ) : view === "list" ? (
        <div className="bg-ink/5 border border-ink/15 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink/10 text-ink/70 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Nº</th>
                <th className="text-left px-4 py-3">Socio</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Nacimiento</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Alta</th>
                <th className="text-left px-4 py-3">Cuota</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-ink/10 hover:bg-ink/5">
                  <td className="px-4 py-3 font-mono text-coral font-semibold">{formatMemberNumber(m.member_number)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img loading="lazy" decoding="async" src={m.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border border-ink/20" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-coral/30 flex items-center justify-center font-bold text-ink">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">
                          {m.full_name}
                          {m.roles.includes("super_admin") && (
                            <span className="ml-2 text-[10px] bg-coral text-ink px-1.5 py-0.5 rounded font-bold align-middle">ADMIN</span>
                          )}
                        </p>
                        <p className="text-xs text-ink/50">@{m.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink/70">{m.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink/70">{m.date_of_birth}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink/70">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {m.dues_paid ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Pagada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-ink/10 text-ink/70 px-2 py-1 rounded font-semibold">
                        <XCircle className="h-3 w-3" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" className="text-ink/70 hover:text-ink hover:bg-ink/10" onClick={() => openMember(m)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink/50">Sin resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => openMember(m)}
              className="text-left bg-ink/5 border border-ink/15 rounded-2xl p-5 hover:bg-ink/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                {m.avatar_url ? (
                  <img loading="lazy" decoding="async" src={m.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover border-2 border-coral" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-coral/30 flex items-center justify-center font-bold text-ink text-xl">
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-coral text-xs font-bold">{formatMemberNumber(m.member_number)}</p>
                  <p className="font-semibold truncate">{m.full_name}</p>
                  <p className="text-xs text-ink/50 truncate">@{m.username}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-ink/70">
                <p className="truncate">{m.email}</p>
                <p>Alta: {new Date(m.created_at).toLocaleDateString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  {m.dues_paid ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      <CheckCircle2 className="h-3 w-3" /> CUOTA OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-ink/10 text-ink/70 px-1.5 py-0.5 rounded font-bold">
                      <XCircle className="h-3 w-3" /> PENDIENTE
                    </span>
                  )}
                  {m.roles.includes("super_admin") && (
                    <span className="text-[10px] bg-coral text-ink px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-ink/50 py-8">Sin resultados.</p>
          )}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md bg-cream text-ink overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="font-display text-2xl">Detalles del socio</SheetTitle>
                <SheetDescription className="font-mono text-coral font-semibold">
                  {formatMemberNumber(selected.member_number)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  {selected.avatar_url ? (
                    <img loading="lazy" decoding="async" src={selected.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-coral" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-coral/30 flex items-center justify-center font-bold text-ink text-3xl">
                      {selected.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-lg">{selected.full_name}</p>
                    <p className="text-sm text-ink/60">@{selected.username}</p>
                    {selected.roles.includes("super_admin") && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] bg-coral text-ink px-1.5 py-0.5 rounded font-bold">
                        <Shield className="h-3 w-3" /> SUPER ADMIN
                      </span>
                    )}
                  </div>
                </div>

                <div className={`rounded-2xl border-2 p-4 ${selected.dues_paid ? "bg-emerald-50 border-emerald-300" : "bg-ink/5 border-ink/20"}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-ink/60 font-semibold">Cuota de socio</p>
                      <p className={`font-bold text-lg ${selected.dues_paid ? "text-emerald-800" : "text-ink/70"}`}>
                        {selected.dues_paid ? "Pagada" : "Pendiente"}
                      </p>
                      {selected.dues_paid && selected.dues_paid_at && (
                        <p className="text-xs text-ink/50 mt-0.5">
                          Actualizada el {new Date(selected.dues_paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {selected.dues_paid ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-8 w-8 text-ink/40 shrink-0" />
                    )}
                  </div>
                  <Button
                    onClick={handleToggleDues}
                    disabled={savingDues}
                    variant={selected.dues_paid ? "outline" : "default"}
                    className="w-full"
                  >
                    {savingDues
                      ? "Guardando…"
                      : selected.dues_paid
                        ? "Marcar como pendiente"
                        : "Marcar cuota como pagada"}
                  </Button>
                </div>

                <div className="rounded-2xl border-2 border-ink/20 bg-ink/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink/60 font-semibold">
                      <Sparkles className="h-4 w-4" /> Karma
                    </div>
                    {karma && (
                      <Button size="sm" variant="ghost" onClick={() => setShowKarmaHistory((v) => !v)}>
                        {showKarmaHistory ? "Ocultar historial" : "Ver historial"}
                      </Button>
                    )}
                  </div>
                  {karmaLoading && <p className="text-sm text-ink/50 mt-2">Cargando…</p>}
                  {!karmaLoading && karma && (
                    <>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                        <p className="font-bold text-lg">
                          {karma.balance} <span className="text-sm font-normal text-ink/60">pts disponibles</span>
                        </p>
                        <p className="text-sm text-ink/70">{karma.lifetime} pts históricos</p>
                      </div>
                      <p className="text-sm font-semibold text-coral mt-1">{levelForKarma(karma.lifetime).name}</p>
                      {karma.feeDiscountEuros > 0 && (
                        <p className="text-sm mt-2 rounded-lg bg-coral/10 border border-coral/30 px-3 py-2">
                          Vale de descuento de cuota acumulado:{" "}
                          <strong>{karma.feeDiscountEuros} €</strong>{" "}
                          <span className="text-ink/50">(50 pts = 1 €)</span>
                        </p>
                      )}
                      {showKarmaHistory && (
                        <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                          {karma.entries.map((e) => (
                            <li key={e.id} className="text-xs border-t border-ink/10 pt-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold truncate">{e.categoryName}</span>
                                <span className="font-mono shrink-0">{e.points > 0 ? `+${e.points}` : e.points}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-ink/50">
                                <span>{KARMA_ENTRY_STATUS_LABELS[e.status] ?? e.status}</span>
                                <span>{new Date(e.created_at).toLocaleDateString()}</span>
                              </div>
                              {e.description && <p className="text-ink/60 mt-0.5">{e.description}</p>}
                            </li>
                          ))}
                          {karma.entries.length === 0 && (
                            <li className="text-xs text-ink/50 pt-2">Sin movimientos de karma.</li>
                          )}
                        </ul>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={selected.email ?? "—"} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Fecha de nacimiento" value={selected.date_of_birth} />
                  <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Género" value={selected.gender.replace("_", " ")} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Alta" value={new Date(selected.created_at).toLocaleDateString()} />
                  {selected.ludoya_username && (
                    <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Ludoya" value={`@${selected.ludoya_username}`} />
                  )}
                </div>

                <MemberBadgesAdmin userId={selected.id} />


                <div className="border-t border-ink/10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <IdCard className="h-4 w-4" /> Documento de identidad
                    </div>
                    {!dni && (
                      <Button size="sm" variant="ghost" onClick={handleRevealDni} disabled={dniLoading}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> {dniLoading ? "Descifrando…" : "Revelar"}
                      </Button>
                    )}
                  </div>
                  {dni && (
                    <code className="block text-xs bg-ink/10 rounded px-3 py-2 border border-ink/20 font-mono">{dni}</code>
                  )}
                  <p className="text-[10px] text-ink/40 mt-2">
                    Cada acceso al DNI queda registrado en el log de auditoría.
                  </p>
                </div>

                <div className="border-t border-ink/10 pt-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Zona peligrosa</p>
                  <p className="text-xs text-ink/60 mb-3">
                    Al eliminar un socio, su número ({formatMemberNumber(selected.member_number)}) queda
                    vacante y se asignará al siguiente socio que se dé de alta.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleting}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={async () => {
                      if (
                        !confirm(
                          `¿Eliminar definitivamente a ${selected.full_name}? Esta acción no se puede deshacer.`,
                        )
                      )
                        return;
                      setDeleting(true);
                      try {
                        await deleteMemberFn({ data: { userId: selected.id } });
                        toast.success("Socio eliminado");
                        setSelectedId(null);
                        load();
                      } catch (e) {
                        toast.error((e as Error).message);
                      } finally {
                        setDeleting(false);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {deleting ? "Eliminando…" : "Eliminar socio"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-ink/50 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink/50 uppercase tracking-wide">{label}</p>
        <p className="text-ink truncate">{value}</p>
      </div>
    </div>
  );
}
