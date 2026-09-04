import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getKonektumOverview, createKonektumEventFn } from "@/lib/konektum.functions";
import { CalendarDays, ArrowRight, Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/konektum/eventos/")({
  component: KonektumEvents,
});


type Overview = Awaited<ReturnType<typeof getKonektumOverview>>;
type Filter = "upcoming" | "past" | "test" | "all";

const STATUS_LABEL: Record<string, string> = {
  pending: "Próximo",
  active: "Activo",
  completed: "Finalizado",
  cancelled: "Cancelado",
  draft: "Borrador",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Próximos y activos" },
  { key: "past", label: "Pasados" },
  { key: "test", label: "De prueba" },
  { key: "all", label: "Todos" },
];

function KonektumEvents() {
  const fn = useServerFn(getKonektumOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const create = useServerFn(createKonektumEventFn);

  useEffect(() => {
    void fn({ data: undefined as never })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [fn]);

  const events = useMemo(() => {
    const all = data?.events ?? [];
    const byFilter = all.filter((e) => {
      if (filter === "all") return true;
      if (filter === "test") return Boolean(e.is_test_event);
      if (e.is_test_event) return false;
      const upcoming = e.status === "pending" || e.status === "active";
      return filter === "upcoming" ? upcoming : !upcoming;
    });
    const needle = q.trim().toLowerCase();
    return needle ? byFilter.filter((e) => e.name.toLowerCase().includes(needle)) : byFilter;
  }, [data, filter, q]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Eventos</h1>
          <p className="text-ink/60 mt-1">Todos los eventos de Konektum.</p>
        </div>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nuevo evento
        </Button>
      </header>

      {error && (
        <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
          No se pudieron cargar los eventos: {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? "bg-coral text-ink" : "text-ink/70 hover:bg-ink/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar evento…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        {events.map((e) => (
          <Link
            key={e.id}
            to="/admin/konektum/eventos/$id"
            params={{ id: e.id }}
            className="rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4 hover:border-coral transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-coral/30 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-ink" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{e.name}</p>
              <p className="text-xs text-ink/60">
                {new Date(e.date).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {STATUS_LABEL[e.status] ?? e.status}
                {e.is_test_event ? " · prueba" : ""}
              </p>
            </div>
            <p className="text-right text-sm">
              <span className="font-display text-xl font-bold">{e.participants_count}</span>
              <br />
              <span className="text-xs text-ink/60">participantes</span>
            </p>
            <ArrowRight className="h-4 w-4 text-ink/40 shrink-0" />
          </Link>
        ))}
        {!error && data && events.length === 0 && (
          <p className="text-sm text-ink/60">No hay eventos con este filtro.</p>
        )}
        {!error && !data && <p className="text-sm text-ink/60">Cargando…</p>}
      </div>

      {creating && (
        <NewEventDialog
          onClose={() => setCreating(false)}
          onCreate={async (values) => {
            const res = await create({ data: values });
            toast.success("Evento creado");
            setCreating(false);
            await navigate({ to: "/admin/konektum/eventos/$id", params: { id: res.id } });
          }}
        />
      )}
    </div>
  );
}

function NewEventDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (values: {
    name: string;
    date: string;
    event_time: string | null;
    event_location: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [place, setPlace] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hora</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lugar</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={() => {
              setSaving(true);
              void onCreate({
                name: name.trim(),
                date,
                event_time: time || null,
                event_location: place || null,
              })
                .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Error"))
                .finally(() => setSaving(false));
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
