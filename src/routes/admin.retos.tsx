import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  retosAdminList, retosAdminCreate, retosAdminDuplicate, retosAdminDelete, retosAdminGet, retosAdminUpdate,
  retosAdminSaveMission, retosAdminDeleteMission, retosAdminExtraTickets, retosAdminRejectCompletion,
  retosAdminDeleteParticipant, retosAdminDraw, retosAdminDeleteDraw,
} from "@/lib/retos.functions";
import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Copy, Download, Gift, Pencil, Plus, Trash2, Ticket, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/retos")({
  head: () => ({ meta: [{ title: "Retos · KLEFF" }, { name: "robots", content: "noindex" }] }),
  component: AdminRetosPage,
});

const STATUS: Record<string, string> = { draft: "Borrador", open: "Abierto", closed: "Cerrado" };
const err = (e: unknown) => toast.error((e as Error).message);
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }) : "Sin fecha";

function AdminRetosPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return selected ? <RetoDetail id={selected} onBack={() => setSelected(null)} /> : <RetoList onOpen={setSelected} />;
}

function RetoList({ onOpen }: { onOpen: (id: string) => void }) {
  const list = useServerFn(retosAdminList);
  const create = useServerFn(retosAdminCreate);
  const dup = useServerFn(retosAdminDuplicate);
  const del = useServerFn(retosAdminDelete);
  const [items, setItems] = useState<Awaited<ReturnType<typeof retosAdminList>>>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const load = useCallback(() => list().then(setItems).catch(err), [list]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Retos</h1>
          <p className="text-sm text-muted-foreground">Misiones para el evento con números para el sorteo.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Crear reto</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <div key={r.id} className="overflow-hidden rounded-lg border bg-card">
            <button onClick={() => onOpen(r.id)} className="block w-full text-left">
              {r.cover_url ? <img src={r.cover_url} alt="" className="aspect-video w-full object-cover" loading="lazy" /> : <div className="aspect-video w-full bg-muted" />}
              <div className="p-4">
                <div className="font-medium">{r.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">kleff.es/{r.slug} · {fmtDate(r.event_date)}</div>
                <div className="mt-2 flex gap-2"><Badge variant="secondary">{STATUS[r.status]}</Badge><Badge variant="outline">{r.participants} participantes</Badge></div>
              </div>
            </button>
            <div className="flex justify-end gap-1 border-t px-2 py-1">
              <Button size="icon" variant="ghost" title="Copiar reto" onClick={async () => { try { const { id } = await dup({ data: { id: r.id } }); toast.success("Copia creada"); await load(); onOpen(id); } catch (e) { err(e); } }}><Copy className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Eliminar" onClick={async () => { if (!confirm(`¿Eliminar «${r.title}» con todos sus participantes?`)) return; try { await del({ data: { id: r.id } }); await load(); } catch (e) { err(e); } }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">Aún no hay retos.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear reto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Noche de juegos de diciembre" /></div>
            <div><Label>Enlace</Label><div className="flex items-center gap-1 text-sm text-muted-foreground">kleff.es/<Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="reto123" /></div></div>
            <p className="text-xs text-muted-foreground">Se crea con las 30 misiones de conexión y las misiones sociales predefinidas.</p>
          </div>
          <DialogFooter><Button disabled={!title.trim()} onClick={async () => { try { const { id } = await create({ data: { title, slug } }); onOpen(id); } catch (e) { err(e); } }}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Detail = Awaited<ReturnType<typeof retosAdminGet>>;

function RetoDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const get = useServerFn(retosAdminGet);
  const [d, setD] = useState<Detail | null>(null);
  const load = useCallback(() => get({ data: { id } }).then(setD).catch(err), [get, id]);
  useEffect(() => { void load(); }, [load]);
  if (!d) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Retos</Button>
      <h1 className="font-display text-2xl">{d.event.title}</h1>
      <Tabs defaultValue="ajustes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          <TabsTrigger value="misiones">Misiones ({d.missions.length})</TabsTrigger>
          <TabsTrigger value="participantes">Participantes ({d.participants.length})</TabsTrigger>
          <TabsTrigger value="sorteo">Sorteo</TabsTrigger>
        </TabsList>
        <TabsContent value="ajustes"><Settings d={d} reload={load} /></TabsContent>
        <TabsContent value="misiones"><Missions d={d} reload={load} /></TabsContent>
        <TabsContent value="participantes"><Participants d={d} reload={load} /></TabsContent>
        <TabsContent value="sorteo"><Draw d={d} reload={load} /></TabsContent>
      </Tabs>
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const dt = new Date(iso);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Settings({ d, reload }: { d: Detail; reload: () => void }) {
  const save = useServerFn(retosAdminUpdate);
  const e = d.event;
  const [f, setF] = useState({ title: e.title, slug: e.slug, date: toLocalInput(e.event_date), location: e.location ?? "", cover_url: e.cover_url ?? "", status: e.status, accounts: e.social_accounts.join(", "), per: e.connection_per_person });
  const [uploading, setUploading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const url = `https://kleff.es/${f.slug}`;
  const downloadQr = () => {
    const c = qrRef.current?.querySelector("canvas");
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `qr-${e.slug}.png`;
    a.click();
  };
  const submit = async () => {
    try {
      await save({ data: { id: e.id, title: f.title, slug: f.slug, event_date: f.date ? new Date(f.date).toISOString() : null, location: f.location, cover_url: f.cover_url, status: f.status as "open", social_accounts: f.accounts.split(/[,\s]+/).filter(Boolean), connection_per_person: Number(f.per) } });
      toast.success("Guardado");
      reload();
    } catch (x) { err(x); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <div><Label>Título</Label><Input value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Fecha y hora</Label><Input type="datetime-local" value={f.date} onChange={(x) => setF({ ...f, date: x.target.value })} /></div>
          <div><Label>Lugar</Label><Input value={f.location} onChange={(x) => setF({ ...f, location: x.target.value })} /></div>
        </div>
        <div><Label>Enlace</Label><div className="flex items-center gap-1 text-sm text-muted-foreground">kleff.es/<Input value={f.slug} onChange={(x) => setF({ ...f, slug: x.target.value })} /></div></div>
        <div><Label>Imagen</Label><ImagePicker url={f.cover_url} onChange={(u) => setF({ ...f, cover_url: u })} height="h-48" onUploadingChange={setUploading} /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><Label>Estado</Label>
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={f.status} onChange={(x) => setF({ ...f, status: x.target.value })}>
              <option value="draft">Borrador</option><option value="open">Abierto</option><option value="closed">Cerrado</option>
            </select>
          </div>
          <div className="sm:col-span-2"><Label>Cuentas de Instagram a seguir</Label><Input value={f.accounts} onChange={(x) => setF({ ...f, accounts: x.target.value })} placeholder="kleff.bcn, otra.cuenta" /></div>
        </div>
        <div className="w-48"><Label>Misiones de conexión por persona</Label><Input type="number" min={0} max={10} value={f.per} onChange={(x) => setF({ ...f, per: Number(x.target.value) })} /></div>
        <Button onClick={submit} disabled={uploading}>{uploading ? "Subiendo imagen…" : "Guardar"}</Button>
      </div>
      <div className="space-y-2 rounded-lg border bg-card p-4 text-center">
        <div ref={qrRef} className="mx-auto w-fit rounded bg-background p-2"><QRCodeCanvas value={url} size={1024} marginSize={2} style={{ width: 200, height: 200 }} /></div>
        <div className="break-all text-xs text-muted-foreground">{url}</div>
        <div className="flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={downloadQr}><Download className="mr-1 h-4 w-4" />QR</Button>
          <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }}><Copy className="mr-1 h-4 w-4" />Enlace</Button>
        </div>
      </div>
    </div>
  );
}

type Mission = Detail["missions"][number];
function Missions({ d, reload }: { d: Detail; reload: () => void }) {
  const save = useServerFn(retosAdminSaveMission);
  const del = useServerFn(retosAdminDeleteMission);
  const [edit, setEdit] = useState<{ id?: string; category: "social" | "conexion"; title: string; title_en: string; tickets: number; active: boolean } | null>(null);
  const done = useMemo(() => { const m = new Map<string, number>(); for (const c of d.completions) if (c.status === "confirmed") m.set(c.mission_id, (m.get(c.mission_id) ?? 0) + 1); return m; }, [d]);
  const toggle = async (m: Mission) => { try { await save({ data: { eventId: d.event.id, id: m.id, category: m.category as "social", title: m.title, tickets: m.tickets, active: !m.active } }); reload(); } catch (e) { err(e); } };
  const section = (cat: "social" | "conexion", label: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><h3 className="font-medium">{label}</h3><Button size="sm" variant="outline" onClick={() => setEdit({ category: cat, title: "", title_en: "", tickets: 1, active: true })}><Plus className="mr-1 h-4 w-4" />Nueva</Button></div>
      <div className="divide-y rounded-lg border bg-card">
        {d.missions.filter((m) => m.category === cat).map((m) => (
          <div key={m.id} className={`flex items-center gap-3 p-3 ${m.active ? "" : "opacity-50"}`}>
            <Switch checked={m.active} onCheckedChange={() => toggle(m)} />
            <div className="min-w-0 flex-1 text-sm">{m.title}{!m.title_en && <span className="ml-2 text-xs text-muted-foreground">(sin inglés)</span>}</div>
            <Badge variant="secondary" className="shrink-0"><Ticket className="mr-1 h-3 w-3" />{m.tickets}</Badge>
            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground" title="Completadas">✓{done.get(m.id) ?? 0}</span>
            <Button size="icon" variant="ghost" onClick={() => setEdit({ id: m.id, category: m.category as "social", title: m.title, title_en: m.title_en ?? "", tickets: m.tickets, active: m.active })}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={async () => { if (!confirm("¿Eliminar esta misión?")) return; try { await del({ data: { id: m.id } }); reload(); } catch (e) { err(e); } }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      {section("social", "Sociales (se validan solas; puedes anularlas en Participantes)")}
      {section("conexion", `Conexión (${d.event.connection_per_person} al azar por persona; las confirma la otra persona)`)}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar misión" : "Nueva misión"}</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">
            <div><Label>Texto en castellano</Label><textarea className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
            <div><Label>Texto en inglés (opcional)</Label><textarea className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" value={edit.title_en} onChange={(e) => setEdit({ ...edit, title_en: e.target.value })} placeholder="Si lo dejas vacío, se mostrará en castellano" /></div>
            <div className="w-40"><Label>Números para el sorteo</Label><Input type="number" min={0} max={100} value={edit.tickets} onChange={(e) => setEdit({ ...edit, tickets: Number(e.target.value) })} /></div>
          </div>}
          <DialogFooter><Button disabled={!edit || edit.title.trim().length < 3} onClick={async () => { if (!edit) return; try { await save({ data: { eventId: d.event.id, id: edit.id ?? null, category: edit.category, title: edit.title, title_en: edit.title_en, tickets: edit.tickets, active: edit.active } }); setEdit(null); reload(); } catch (e) { err(e); } }}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Participants({ d, reload }: { d: Detail; reload: () => void }) {
  const extra = useServerFn(retosAdminExtraTickets);
  const reject = useServerFn(retosAdminRejectCompletion);
  const delP = useServerFn(retosAdminDeleteParticipant);
  const [open, setOpen] = useState<string | null>(null);
  const name = new Map(d.participants.map((p) => [p.id, p.nickname]));
  const mission = new Map(d.missions.map((m) => [m.id, m]));
  return (
    <div className="divide-y rounded-lg border bg-card">
      {!d.participants.length && <p className="p-4 text-sm text-muted-foreground">Aún no se ha apuntado nadie.</p>}
      {d.participants.map((p) => {
        const tickets = d.tickets.filter((t) => t.participant_id === p.id);
        const comps = d.completions.filter((c) => c.participant_id === p.id);
        const isOpen = open === p.id;
        return (
          <div key={p.id} className="p-3">
            <div className="flex items-center gap-3">
              <img src={p.avatar_url ?? ""} alt="" className="h-10 w-10 rounded-full bg-muted object-cover" />
              <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : p.id)}>
                <div className="font-medium">{p.nickname}</div>
                <div className="text-xs text-muted-foreground">{comps.filter((c) => c.status === "confirmed").length} misiones · {tickets.length} números · código {p.access_code}</div>
              </button>
              <Button size="sm" variant="outline" title="Participaciones extra" onClick={async () => { const n = Number(prompt("¿Cuántas participaciones extra?", "1")); if (!n) return; try { const r = await extra({ data: { participantId: p.id, count: n } }); toast.success(`Números: ${r.numbers.join(", ")}`); reload(); } catch (e) { err(e); } }}><Plus className="h-4 w-4" /><Ticket className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={async () => { if (!confirm(`¿Eliminar a ${p.nickname}?`)) return; try { await delP({ data: { id: p.id } }); reload(); } catch (e) { err(e); } }}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {isOpen && (
              <div className="mt-3 space-y-2 pl-13 text-sm">
                <div className="flex flex-wrap gap-1">{tickets.map((t) => <Badge key={t.id} variant="outline">#{t.number}</Badge>)}</div>
                {comps.map((c) => {
                  const m = mission.get(c.mission_id);
                  return (
                    <div key={c.id} className="flex items-start gap-2 rounded border p-2">
                      <div className="min-w-0 flex-1">
                        <div>{m?.title ?? "Misión"}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.status === "confirmed" ? "✓ Completada" : c.status === "pending" ? "Esperando confirmación" : "✗ Anulada"}
                          {c.partner_ids.length ? ` · con ${c.partner_ids.map((x) => name.get(x) ?? "?").join(", ")}` : ""}
                          {c.evidence ? ` · ${c.evidence}` : ""}
                        </div>
                      </div>
                      {c.status !== "rejected" && <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("¿Anular esta misión y sus números?")) return; try { await reject({ data: { id: c.id } }); reload(); } catch (e) { err(e); } }}><X className="h-4 w-4" />Anular</Button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Draw({ d, reload }: { d: Detail; reload: () => void }) {
  const draw = useServerFn(retosAdminDraw);
  const delDraw = useServerFn(retosAdminDeleteDraw);
  const [prize, setPrize] = useState("");
  const [rolling, setRolling] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const pById = new Map(d.participants.map((p) => [p.id, p]));
  const tById = new Map(d.tickets.map((t) => [t.id, t]));
  const run = async () => {
    if (!d.tickets.length) return;
    setBusy(true);
    const nums = d.tickets.map((t) => t.number);
    const iv = setInterval(() => setRolling(nums[Math.floor(Math.random() * nums.length)] ?? null), 70);
    try {
      const r = await draw({ data: { eventId: d.event.id, prize } });
      await new Promise((ok) => setTimeout(ok, 1500));
      clearInterval(iv);
      setRolling(r.number);
      toast.success(`¡#${r.number} · ${pById.get(r.participantId)?.nickname ?? ""}!`);
      setPrize("");
      reload();
    } catch (e) { clearInterval(iv); setRolling(null); err(e); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="text-sm text-muted-foreground">{d.tickets.length} números en juego · {d.participants.length} participantes</div>
        <div className="my-4 font-display text-6xl tabular-nums">{rolling != null ? `#${rolling}` : "—"}</div>
        <div className="mx-auto flex max-w-md gap-2">
          <Input value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Premio (opcional)" />
          <Button onClick={run} disabled={busy || !d.tickets.length}><Gift className="mr-1 h-4 w-4" />Sortear</Button>
        </div>
      </div>
      <div className="divide-y rounded-lg border bg-card">
        {!d.draws.length && <p className="p-4 text-sm text-muted-foreground">Aún no hay ganadores.</p>}
        {d.draws.map((w) => {
          const t = tById.get(w.ticket_id);
          const p = t ? pById.get(t.participant_id) : undefined;
          return (
            <div key={w.id} className="flex items-center gap-3 p-3">
              <img src={p?.avatar_url ?? ""} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
              <div className="flex-1"><div className="font-medium">#{t?.number} · {p?.nickname}</div>{w.prize && <div className="text-xs text-muted-foreground">{w.prize}</div>}</div>
              <Button size="icon" variant="ghost" onClick={async () => { try { await delDraw({ data: { id: w.id } }); reload(); } catch (e) { err(e); } }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
