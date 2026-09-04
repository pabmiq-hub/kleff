import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getKonektumPeople,
  getKonektumPerson,
  saveKonektumPerson,
} from "@/lib/konektum.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/konektum/usuarios")({
  component: Page,
});

type Person = Awaited<ReturnType<typeof getKonektumPeople>>[number];
type PersonDetail = Awaited<ReturnType<typeof getKonektumPerson>>;

function Page() {
  const load = useServerFn(getKonektumPeople);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);

  const refresh = useCallback(() => {
    void load({ data: undefined as never })
      .then(setPeople)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, [load]);

  useEffect(refresh, [refresh]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (people ?? []).filter(
      (p) =>
        !needle ||
        (p.display_name ?? "").toLowerCase().includes(needle) ||
        (p.email ?? "").toLowerCase().includes(needle) ||
        (p.phone ?? "").includes(needle),
    );
  }, [people, q]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Usuarios</h1>
        <p className="text-ink/60 mt-1">
          {people ? `${people.length} personas en la base de contactos.` : "Cargando contactos…"}
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-coral bg-coral/10 p-5 text-sm">
          No se pudieron cargar los contactos: {error}
        </div>
      )}

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, email o teléfono…"
        className="sm:w-96"
      />

      <div className="space-y-2">
        {list.slice(0, 300).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className="w-full text-left rounded-2xl border border-ink/15 bg-ink/5 p-4 flex items-center gap-4 hover:border-coral transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.display_name ?? "Sin nombre"}</p>
              <p className="text-xs text-ink/60 truncate">
                {[p.email, p.phone].filter(Boolean).join(" · ") || "Sin contacto"}
              </p>
            </div>
            {p.status && (
              <span className="rounded-full bg-ink/10 px-2 py-1 text-xs">{p.status}</span>
            )}
            <p className="text-right text-sm">
              <span className="font-display text-xl font-bold">{p.events_attended ?? 0}</span>
              <br />
              <span className="text-xs text-ink/60">eventos</span>
            </p>
          </button>
        ))}
        {people && list.length === 0 && <p className="text-sm text-ink/60">Sin resultados.</p>}
        {list.length > 300 && (
          <p className="text-xs text-ink/50">Mostrando los primeros 300 resultados.</p>
        )}
      </div>

      {selected && (
        <PersonDialog
          person={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function PersonDialog({
  person,
  onClose,
  onSaved,
}: {
  person: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const load = useServerFn(getKonektumPerson);
  const save = useServerFn(saveKonektumPerson);
  const [detail, setDetail] = useState<PersonDetail | null>(null);
  const [form, setForm] = useState({
    display_name: person.display_name ?? "",
    email: person.email ?? "",
    phone: person.phone ?? "",
    status: person.status ?? "",
    source_notes: person.source_notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load({ data: { personId: person.id } })
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [load, person.id]);

  const eventName = (id: string) => detail?.events.find((e) => e.id === id)?.name ?? "Evento";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{person.display_name ?? "Contacto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Input
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Textarea
              value={form.source_notes}
              onChange={(e) => setForm((f) => ({ ...f, source_notes: e.target.value }))}
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Historial</p>
            {!detail && <p className="text-sm text-ink/60">Cargando…</p>}
            <ul className="space-y-1 text-sm max-h-48 overflow-auto">
              {detail?.attendances.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate">{eventName(a.event_id)}</span>
                  {a.cancelled_at && <span className="text-xs text-ink/50">cancelado</span>}
                  {a.checked_in && <span className="text-xs text-ink/50">asistió</span>}
                </li>
              ))}
              {detail && detail.attendances.length === 0 && (
                <li className="text-ink/60">Sin eventos registrados.</li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            disabled={saving}
            onClick={() => {
              setSaving(true);
              void save({
                data: {
                  personId: person.id,
                  patch: {
                    display_name: form.display_name || null,
                    email: form.email || null,
                    phone: form.phone || null,
                    status: form.status || null,
                    source_notes: form.source_notes || null,
                  },
                },
              })
                .then(() => {
                  toast.success("Contacto actualizado");
                  onSaved();
                })
                .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Error"))
                .finally(() => setSaving(false));
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
