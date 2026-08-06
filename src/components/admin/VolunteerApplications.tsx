import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListVolunteerApplications,
  adminUpdateVolunteerApplication,
} from "@/lib/volunteers.functions";
import { VOLUNTEER_STATUS_LABELS } from "@/lib/volunteer-options";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Application = Awaited<ReturnType<typeof adminListVolunteerApplications>>["applications"][number];

const FIELD_LABELS: Record<string, string> = {
  areas: "Áreas de colaboración",
  eventCategories: "Tipos de evento",
  eventRoles: "Rol en el evento",
  benefits: "Beneficios deseados",
  languages: "Idiomas",
  institutional: "Áreas institucionales",
  availability: "Disponibilidad",
  duesOpinion: "¿Cuota de socio?",
  duesAmount: "Importe anual justo",
  duesBenefits: "Beneficios de la cuota",
  comments: "Comentarios",
};

export function VolunteerApplications() {
  const list = useServerFn(adminListVolunteerApplications);
  const update = useServerFn(adminUpdateVolunteerApplication);
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const res = await list();
      setRows(res.applications);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (a: Application) => {
    setSelected(a);
    setNotes(a.adminNotes ?? "");
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await update({ data: { id, status: status as "pending" | "reviewing" | "accepted" | "declined" } });
      toast.success("Estado actualizado");
      setSelected(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await update({ data: { id: selected.id, adminNotes: notes } });
      toast.success("Notas guardadas");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las solicitudes</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="reviewing">En revisión</SelectItem>
            <SelectItem value="accepted">Aceptadas</SelectItem>
            <SelectItem value="declined">Descartadas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-ink/60">{visible.length} solicitud(es)</span>
      </div>

      {loading ? (
        <p className="text-ink/60">Cargando…</p>
      ) : visible.length === 0 ? (
        <p className="text-ink/60">No hay solicitudes en este estado.</p>
      ) : (
        <div className="grid gap-3">
          {visible.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 bg-cream-deep/40 border border-ink/10 rounded-2xl p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-ink">{a.fullName}</div>
                <div className="text-xs text-ink/60 truncate">
                  {a.email}
                  {a.member?.member_number ? ` · Socio #${a.member.member_number}` : ""} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("es-ES")}
                </div>
              </div>
              <span className="text-xs bg-ink/10 text-ink/70 px-2 py-1 rounded">
                {VOLUNTEER_STATUS_LABELS[a.status] ?? a.status}
              </span>
              <Button size="sm" variant="outline" onClick={() => open(a)}>
                Ver
              </Button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.fullName}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="text-ink/70">
                <div>{selected.email}</div>
                {selected.phone && <div>{selected.phone}</div>}
                <div className="text-xs mt-1">
                  Enviada el {new Date(selected.createdAt).toLocaleString("es-ES")}
                </div>
              </div>

              <div className="space-y-3 border-t pt-3">
                {Object.entries(FIELD_LABELS).map(([key, label]) => {
                  const value = selected.answers[key];
                  const text = Array.isArray(value) ? value.join(", ") : (value ?? "");
                  if (!text) return null;
                  return (
                    <div key={key}>
                      <div className="text-xs uppercase tracking-wide text-ink/50">{label}</div>
                      <div className="text-ink">{key === "duesOpinion" ? (text === "yes" ? "Sí" : "No") : text}</div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="text-xs uppercase tracking-wide text-ink/50">Notas internas</div>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button size="sm" variant="outline" onClick={saveNotes}>
                  Guardar notas
                </Button>
              </div>

              <div className="border-t pt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(selected.id, "reviewing")}>
                  En revisión
                </Button>
                <Button
                  size="sm"
                  className="bg-coral text-cream hover:bg-coral/90"
                  onClick={() => setStatus(selected.id, "accepted")}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => setStatus(selected.id, "declined")}
                >
                  Descartar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
