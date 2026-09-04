import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getKonektumEvent,
  saveKonektumEvent,
  saveKonektumParticipant,
  addKonektumParticipant,
  removeKonektumParticipant,
  addKonektumPairFn,
  removeKonektumPairFn,
  promoteKonektumWaitlistFn,
  generateKonektumTablesFn,
} from "@/lib/konektum.functions";
import { ArrowLeft, Check, Loader2, Plus, Trash2, RefreshCw, Heart, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/konektum/eventos/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: KonektumEventDetail,
});

type Detail = Awaited<ReturnType<typeof getKonektumEvent>>;
type Participant = Detail["participants"][number];

const TABS = [
  "participantes",
  "checkin",
  "espera",
  "mesas",
  "selecciones",
  "matches",
  "ajustes",
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  participantes: "Participantes",
  checkin: "Check-in",
  espera: "Lista de espera",
  mesas: "Mesas",
  selecciones: "Selecciones",
  matches: "Matches",
  ajustes: "Ajustes",
};

function KonektumEventDetail() {
  const { id } = Route.useParams();
  const load = useServerFn(getKonektumEvent);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("participantes");

  const refresh = useCallback(() => {
    void load({ data: { eventId: id } })
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [load, id]);

  useEffect(refresh, [refresh]);

  if (error) {
    return (
      <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
        No se pudo cargar el evento: {error}
      </div>
    );
  }
  if (!detail) return <p className="text-sm text-ink/60">Cargando evento…</p>;

  const ev = detail.event;
  const active = detail.participants.filter((p) => !p.cancelled_at);

  return (
    <div className="space-y-6">
      <Link
        to="/admin/konektum/eventos"
        className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a eventos
      </Link>

      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold truncate">{ev.name}</h1>
          <p className="text-ink/60 mt-1 text-sm">
            {new Date(ev.date).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {ev['event_time'] ? ` · ${String(ev['event_time'])}` : ""}
            {ev['event_location'] ? ` · ${String(ev['event_location'])}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-4 text-center">
          <Metric label="Participantes" value={active.length} />
          <Metric label="Check-in" value={active.filter((p) => p.checked_in).length} />
          <Metric
            label="Han elegido"
            value={active.filter((p) => p.selection_submitted_at).length}
          />
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-ink/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "bg-coral text-ink" : "text-ink/70 hover:bg-ink/10"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      {tab === "participantes" && <ParticipantsTab detail={detail} refresh={refresh} eventId={id} />}
      {tab === "checkin" && <CheckinTab detail={detail} refresh={refresh} />}
      {tab === "espera" && <WaitlistTab detail={detail} refresh={refresh} />}
      {tab === "mesas" && <TablesTab detail={detail} refresh={refresh} eventId={id} />}
      {tab === "selecciones" && <SelectionsTab detail={detail} />}
      {tab === "matches" && <MatchesTab detail={detail} />}
      {tab === "ajustes" && <SettingsTab detail={detail} refresh={refresh} eventId={id} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs text-ink/60 mt-1">{label}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-ink/15 bg-ink/5 p-4">{children}</div>;
}

/* ---------------- Participantes ---------------- */

function ParticipantsTab({
  detail,
  refresh,
  eventId,
}: {
  detail: Detail;
  refresh: () => void;
  eventId: string;
}) {
  const save = useServerFn(saveKonektumParticipant);
  const add = useServerFn(addKonektumParticipant);
  const remove = useServerFn(removeKonektumParticipant);
  const addPair = useServerFn(addKonektumPairFn);
  const removePair = useServerFn(removeKonektumPairFn);

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return detail.participants.filter(
      (p) =>
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.email ?? "").toLowerCase().includes(needle),
    );
  }, [detail.participants, q]);

  const nameOf = (pid: string) => detail.participants.find((p) => p.id === pid)?.name ?? "—";

  async function patch(participantId: string, values: Record<string, unknown>) {
    setBusy(true);
    try {
      await save({ data: { participantId, patch: values } });
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar participante…"
          className="sm:w-72"
        />
        <Button className="sm:ml-auto" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Añadir participante
        </Button>
      </div>

      <div className="space-y-2">
        {list.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-4 flex flex-wrap items-center gap-3 ${
              p.cancelled_at ? "border-ink/10 bg-ink/5 opacity-60" : "border-ink/15 bg-ink/5"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {p.name}
                {p.is_fake ? <span className="text-xs text-ink/50"> · ficticio</span> : null}
                {p.cancelled_at ? <span className="text-xs text-ink/50"> · cancelado</span> : null}
              </p>
              <p className="text-xs text-ink/60 truncate">
                {[p.email, p.phone, p.gender, p.age_range, p.company_name]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {p.checked_in && (
                <span className="rounded-full bg-coral/30 px-2 py-1">Check-in</span>
              )}
              {p.selection_submitted_at && (
                <span className="rounded-full bg-ink/10 px-2 py-1">Ha elegido</span>
              )}
              {p.payment_status && (
                <span className="rounded-full bg-ink/10 px-2 py-1">{p.payment_status}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (!confirm(`¿Eliminar a ${p.name}?`)) return;
                  setBusy(true);
                  void remove({ data: { participantId: p.id } })
                    .then(refresh)
                    .catch((e: unknown) =>
                      toast.error(e instanceof Error ? e.message : "Error al eliminar"),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-sm text-ink/60">Sin participantes.</p>}
      </div>

      <PairsSection
        title="Exclusiones"
        description="Estas personas nunca coincidirán en la misma mesa."
        kind="exclusion"
        pairs={detail.exclusions}
        participants={detail.participants}
        nameOf={nameOf}
        onAdd={async (p1, p2) => {
          await addPair({ data: { kind: "exclusion", eventId, p1, p2, reason: null } });
          refresh();
        }}
        onRemove={async (pid) => {
          await removePair({ data: { kind: "exclusion", id: pid } });
          refresh();
        }}
      />
      <PairsSection
        title="Inclusiones"
        description="Estas personas se intentarán sentar juntas."
        kind="inclusion"
        pairs={detail.inclusions}
        participants={detail.participants}
        nameOf={nameOf}
        onAdd={async (p1, p2) => {
          await addPair({ data: { kind: "inclusion", eventId, p1, p2, reason: null } });
          refresh();
        }}
        onRemove={async (pid) => {
          await removePair({ data: { kind: "inclusion", id: pid } });
          refresh();
        }}
      />

      {editing && (
        <ParticipantDialog
          participant={editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            await patch(editing.id, values);
            setEditing(null);
          }}
        />
      )}
      {adding && (
        <ParticipantDialog
          onClose={() => setAdding(false)}
          onSave={async (values) => {
            try {
              await add({ data: { eventId, values } });
              refresh();
              setAdding(false);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Error al crear");
            }
          }}
        />
      )}
    </div>
  );
}

function ParticipantDialog({
  participant,
  onClose,
  onSave,
}: {
  participant?: Participant;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: participant?.name ?? "",
    email: participant?.email ?? "",
    phone: participant?.phone ?? "",
    gender: participant?.gender ?? "",
    age: participant?.age?.toString() ?? "",
    age_range: participant?.age_range ?? "",
    company_name: participant?.company_name ?? "",
    sector: participant?.sector ?? "",
    payment_status: participant?.payment_status ?? "",
  });
  const [saving, setSaving] = useState(false);

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{participant ? "Editar participante" : "Nuevo participante"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {field("name", "Nombre")}
          {field("email", "Email", "email")}
          {field("phone", "Teléfono")}
          {field("gender", "Género")}
          {field("age", "Edad", "number")}
          {field("age_range", "Franja de edad")}
          {field("company_name", "Empresa")}
          {field("sector", "Sector")}
          {field("payment_status", "Estado de pago")}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={saving || !form.name.trim()}
            onClick={() => {
              setSaving(true);
              void onSave({
                name: form.name.trim(),
                email: form.email || null,
                phone: form.phone || null,
                gender: form.gender || null,
                age: form.age ? Number(form.age) : null,
                age_range: form.age_range || null,
                company_name: form.company_name || null,
                sector: form.sector || null,
                payment_status: form.payment_status || null,
              }).finally(() => setSaving(false));
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PairsSection({
  title,
  description,
  pairs,
  participants,
  nameOf,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  kind: "exclusion" | "inclusion";
  pairs: Detail["exclusions"];
  participants: Participant[];
  nameOf: (id: string) => string;
  onAdd: (p1: string, p2: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  return (
    <Card>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="text-xs text-ink/60 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <select
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          className="rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm"
        >
          <option value="">Persona 1…</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          className="rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm"
        >
          <option value="">Persona 2…</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={!p1 || !p2 || p1 === p2}
          onClick={() => {
            void onAdd(p1, p2).then(() => {
              setP1("");
              setP2("");
            });
          }}
        >
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </div>
      <div className="space-y-1">
        {pairs.map((x) => (
          <div key={x.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">
              {nameOf(x.participant_1_id)} ↔ {nameOf(x.participant_2_id)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void onRemove(x.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {pairs.length === 0 && <p className="text-sm text-ink/60">Ninguna.</p>}
      </div>
    </Card>
  );
}

/* ---------------- Check-in ---------------- */

function CheckinTab({ detail, refresh }: { detail: Detail; refresh: () => void }) {
  const save = useServerFn(saveKonektumParticipant);
  const [q, setQ] = useState("");
  const active = detail.participants.filter((p) => !p.cancelled_at);
  const needle = q.trim().toLowerCase();
  const list = active.filter((p) => !needle || p.name.toLowerCase().includes(needle));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="sm:w-72"
        />
        <p className="text-sm text-ink/60">
          {active.filter((p) => p.checked_in).length} de {active.length} han llegado
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              void save({ data: { participantId: p.id, patch: { checked_in: !p.checked_in } } })
                .then(refresh)
                .catch((e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Error al guardar"),
                );
            }}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              p.checked_in ? "border-coral bg-coral/20" : "border-ink/15 bg-ink/5 hover:border-ink/30"
            }`}
          >
            <p className="font-medium truncate flex items-center gap-2">
              {p.checked_in && <Check className="h-4 w-4" />} {p.name}
            </p>
            <p className="text-xs text-ink/60 truncate">{p.email ?? "Sin email"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Lista de espera ---------------- */

function WaitlistTab({ detail, refresh }: { detail: Detail; refresh: () => void }) {
  const promote = useServerFn(promoteKonektumWaitlistFn);
  return (
    <div className="space-y-2">
      {detail.waitlist.map((w) => (
        <div key={w.id} className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-3">
          <span className="font-display text-xl font-bold w-8">{w.position ?? "–"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{w.name}</p>
            <p className="text-xs text-ink/60 truncate">
              {[w.email, w.phone].filter(Boolean).join(" · ")} · {w.status}
            </p>
          </div>
          {w.status !== "promoted" && (
            <Button
              size="sm"
              onClick={() => {
                void promote({ data: { entryId: w.id } })
                  .then(() => {
                    toast.success("Persona añadida al evento");
                    refresh();
                  })
                  .catch((e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Error al promover"),
                  );
              }}
            >
              Dar plaza
            </Button>
          )}
        </div>
      ))}
      {detail.waitlist.length === 0 && <p className="text-sm text-ink/60">Lista de espera vacía.</p>}
    </div>
  );
}

/* ---------------- Mesas ---------------- */

interface Seat {
  id: string;
  name: string;
}
interface RoundTables {
  round: number;
  tables: Seat[][];
}

function TablesTab({
  detail,
  refresh,
  eventId,
}: {
  detail: Detail;
  refresh: () => void;
  eventId: string;
}) {
  const generate = useServerFn(generateKonektumTablesFn);
  const [busy, setBusy] = useState(false);
  const rounds = (Array.isArray(detail.event['tables']) ? detail.event['tables'] : []) as RoundTables[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink/60">
          {Number(detail.event['rounds'] ?? 1)} rondas · mesas de {Number(detail.event['table_size'] ?? 4)}
          {detail.event['gender_parity'] ? " · paridad de género" : ""}
        </p>
        <Button
          className="sm:ml-auto"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void generate({ data: { eventId } })
              .then(() => {
                toast.success("Mesas generadas");
                refresh();
              })
              .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Error"))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{" "}
          Generar mesas
        </Button>
      </div>

      {rounds.map((r) => (
        <div key={r.round} className="space-y-2">
          <h3 className="font-display text-lg font-bold">Ronda {r.round}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(r.tables ?? []).map((seats, i) => (
              <Card key={i}>
                <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">Mesa {i + 1}</p>
                <ul className="space-y-1 text-sm">
                  {seats.map((s) => (
                    <li key={s.id} className="truncate">
                      {s.name}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {rounds.length === 0 && <p className="text-sm text-ink/60">Aún no hay mesas generadas.</p>}
    </div>
  );
}

/* ---------------- Selecciones ---------------- */

function SelectionsTab({ detail }: { detail: Detail }) {
  const nameOf = (pid: string) => detail.participants.find((p) => p.id === pid)?.name ?? "—";
  const bySelector = new Map<string, Detail["selections"]>();
  for (const s of detail.selections) {
    const arr = bySelector.get(s.selector_id) ?? [];
    arr.push(s);
    bySelector.set(s.selector_id, arr);
  }
  const submitted = detail.participants.filter((p) => p.selection_submitted_at).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        {detail.selections.length} selecciones de {submitted} participantes.
      </p>
      <div className="space-y-2">
        {[...bySelector.entries()].map(([selector, list]) => (
          <Card key={selector}>
            <p className="font-medium">{nameOf(selector)}</p>
            <ul className="mt-1 flex flex-wrap gap-2 text-sm">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="rounded-full bg-ink/10 px-3 py-1 flex items-center gap-1"
                >
                  {s.is_super_like && <Star className="h-3 w-3" />} {nameOf(s.selected_id)}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {bySelector.size === 0 && <p className="text-sm text-ink/60">Sin selecciones todavía.</p>}
      </div>
    </div>
  );
}

/* ---------------- Matches ---------------- */

function MatchesTab({ detail }: { detail: Detail }) {
  const nameOf = (pid: string) => detail.participants.find((p) => p.id === pid)?.name ?? "—";
  const set = new Set(detail.selections.map((s) => `${s.selector_id}->${s.selected_id}`));
  const seen = new Set<string>();
  const matches: { a: string; b: string; superLike: boolean }[] = [];
  for (const s of detail.selections) {
    const key = [s.selector_id, s.selected_id].sort().join(":");
    if (seen.has(key)) continue;
    if (set.has(`${s.selected_id}->${s.selector_id}`)) {
      seen.add(key);
      matches.push({
        a: s.selector_id,
        b: s.selected_id,
        superLike: Boolean(s.is_super_like),
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="font-display text-lg font-bold">Matches mutuos ({matches.length})</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {matches.map((m) => (
            <Card key={`${m.a}:${m.b}`}>
              <p className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-coral" />
                <span className="font-medium">{nameOf(m.a)}</span> ↔{" "}
                <span className="font-medium">{nameOf(m.b)}</span>
                {m.superLike && <Star className="h-3 w-3" />}
              </p>
            </Card>
          ))}
          {matches.length === 0 && <p className="text-sm text-ink/60">Sin matches todavía.</p>}
        </div>
      </section>

      <RequestList title="Crush" items={detail.crushRequests} nameOf={nameOf} />
      <RequestList title="Repetir mesa" items={detail.repeatRequests} nameOf={nameOf} />
    </div>
  );
}

function RequestList({
  title,
  items,
  nameOf,
}: {
  title: string;
  items: Detail["crushRequests"];
  nameOf: (id: string) => string;
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-lg font-bold">
        {title} ({items.length})
      </h3>
      <div className="space-y-1">
        {items.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">
              {nameOf(r.requester_id)} → {nameOf(r.target_id)}
            </span>
            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs">{r.status}</span>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink/60">Ninguna solicitud.</p>}
      </div>
    </section>
  );
}

/* ---------------- Ajustes ---------------- */

const TOGGLES: { key: string; label: string }[] = [
  { key: "registration_open", label: "Inscripciones abiertas" },
  { key: "checkin_open", label: "Check-in abierto" },
  { key: "waitlist_enabled", label: "Lista de espera" },
  { key: "crush_enabled", label: "Crush" },
  { key: "repeat_request_enabled", label: "Repetir mesa" },
  { key: "super_like_enabled", label: "Super like" },
  { key: "wrapped_enabled", label: "Wrapped" },
  { key: "gender_parity", label: "Paridad de género" },
  { key: "avoid_previous_encounters", label: "Evitar encuentros previos" },
  { key: "is_test_event", label: "Evento de prueba" },
];

const NUMBERS: { key: string; label: string }[] = [
  { key: "table_size", label: "Personas por mesa" },
  { key: "rounds", label: "Rondas" },
  { key: "round_duration", label: "Duración de ronda (min)" },
  { key: "selection_deadline_hours", label: "Horas para elegir" },
];

const STATUSES = ["pending", "active", "completed", "cancelled"];

function SettingsTab({
  detail,
  refresh,
  eventId,
}: {
  detail: Detail;
  refresh: () => void;
  eventId: string;
}) {
  const save = useServerFn(saveKonektumEvent);
  const ev = detail.event;
  const [form, setForm] = useState<Record<string, unknown>>({
    name: ev.name,
    date: ev.date,
    event_time: ev['event_time'] ?? "",
    event_location: ev['event_location'] ?? "",
    status: ev.status,
    ...Object.fromEntries(TOGGLES.map((t) => [t.key, Boolean(ev[t.key])])),
    ...Object.fromEntries(NUMBERS.map((n) => [n.key, ev[n.key] ?? ""])),
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input value={String(form['name'] ?? "")} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fecha</Label>
            <Input
              type="date"
              value={String(form['date'] ?? "")}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hora</Label>
            <Input
              value={String(form['event_time'] ?? "")}
              onChange={(e) => set("event_time", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lugar</Label>
            <Input
              value={String(form['event_location'] ?? "")}
              onChange={(e) => set("event_location", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <select
              value={String(form['status'] ?? "")}
              onChange={(e) => set("status", e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-cream px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {NUMBERS.map((n) => (
            <div key={n.key} className="space-y-1">
              <Label className="text-xs">{n.label}</Label>
              <Input
                type="number"
                value={String(form[n.key] ?? "")}
                onChange={(e) => set(n.key, e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid sm:grid-cols-2 gap-3">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between gap-3">
              <Label className="text-sm">{t.label}</Label>
              <Switch
                checked={Boolean(form[t.key])}
                onCheckedChange={(v) => set(t.key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Button
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void save({ data: { eventId, patch: form } })
            .then(() => {
              toast.success("Cambios guardados");
              refresh();
            })
            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Error al guardar"))
            .finally(() => setSaving(false));
        }}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar cambios
      </Button>
    </div>
  );
}
