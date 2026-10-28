import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListContests, adminCreateContest, adminGetContest, adminUpdateContest, adminDeleteContest,
  adminAddCategory, adminDeleteCategory, adminSaveEntry, adminDeleteEntry, adminRunRaffle,
} from "@/lib/contests.functions";
import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Copy, Gift, Pencil, Plus, QrCode, Trash2, Trophy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/concurso")({
  head: () => ({ meta: [{ title: "Concursos de disfraces · KLEFF" }, { name: "robots", content: "noindex" }] }),
  component: AdminContestsPage,
});

const STATUS: Record<string, string> = { draft: "Borrador", open: "Votación abierta", closed: "Cerrado" };

function AdminContestsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return selected ? <ContestDetail id={selected} onBack={() => setSelected(null)} /> : <ContestList onOpen={setSelected} />;
}

function ContestList({ onOpen }: { onOpen: (id: string) => void }) {
  const list = useServerFn(adminListContests);
  const create = useServerFn(adminCreateContest);
  const [items, setItems] = useState<Awaited<ReturnType<typeof adminListContests>>>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cats, setCats] = useState("Más original\nMás terrorífico\nMejor grupo");
  useEffect(() => { list().then(setItems).catch((e) => toast.error(e.message)); }, [list]);

  const submit = async () => {
    try {
      const { id } = await create({ data: { name, slug, categories: cats.split("\n").map((s) => s.trim()).filter(Boolean) } });
      onOpen(id);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Concursos de disfraces</h1>
          <p className="text-sm text-muted-foreground">Crea un concurso, sube a los participantes y comparte el enlace de votación.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Nuevo concurso</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <button key={c.id} onClick={() => onOpen(c.id)} className="rounded-lg border bg-card p-4 text-left hover:border-primary">
            <div className="font-medium">{c.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">/concurso/{c.slug}</div>
            <Badge variant="secondary" className="mt-2">{STATUS[c.status]}</Badge>
          </button>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">Aún no hay concursos.</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo concurso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Halloween 2026" /></div>
            <div><Label>Enlace</Label><div className="flex items-center gap-1 text-sm text-muted-foreground">kleff.es/concurso/<Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="halloween" /></div></div>
            <div><Label>Categorías (una por línea)</Label><textarea className="min-h-24 w-full rounded-md border bg-background p-2 text-sm" value={cats} onChange={(e) => setCats(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={!name.trim()}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Detail = Awaited<ReturnType<typeof adminGetContest>>;
type EntryDraft = { id: string | null; name: string; photoUrl: string; categoryIds: string[] };

function ContestDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const get = useServerFn(adminGetContest);
  const update = useServerFn(adminUpdateContest);
  const del = useServerFn(adminDeleteContest);
  const addCat = useServerFn(adminAddCategory);
  const delCat = useServerFn(adminDeleteCategory);
  const saveEntry = useServerFn(adminSaveEntry);
  const delEntry = useServerFn(adminDeleteEntry);
  const raffle = useServerFn(adminRunRaffle);
  const [d, setD] = useState<Detail | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", status: "open" });
  const [newCat, setNewCat] = useState("");
  const [draft, setDraft] = useState<EntryDraft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await get({ data: { id } });
      setD(r);
      setForm({ name: r.contest.name, slug: r.contest.slug, status: r.contest.status });
    } catch (e) { toast.error((e as Error).message); }
  }, [get, id]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); await load(); } catch (e) { toast.error((e as Error).message); }
  };
  if (!d) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  const url = `https://kleff.es/concurso/${d.contest.slug}`;
  const entryName = (eid: string) => d.entries.find((e) => e.id === eid)?.name ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Concursos</Button>
        <h1 className="font-display text-2xl">{d.contest.name}</h1>
        <Badge variant="secondary">{STATUS[d.contest.status]}</Badge>
      </div>

      <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Enlace</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
        <div><Label>Estado</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={() => run(() => update({ data: { id, ...form } }), "Guardado")}>Guardar</Button>
        <div className="flex flex-wrap items-center gap-2 text-sm md:col-span-4">
          <span className="truncate font-mono">{url}</span>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Enlace copiado"); }}><Copy className="mr-1 h-3 w-3" />Copiar</Button>
          <Button size="sm" variant="outline" onClick={() => setShowQr(true)}><QrCode className="mr-1 h-3 w-3" />Código QR</Button>
          <a href={`/concurso/${d.contest.slug}`} target="_blank" rel="noreferrer" className="text-primary underline">Abrir</a>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Categorías</h2>
        <div className="flex flex-wrap gap-2">
          {d.categories.map((c) => (
            <Badge key={c.id} variant="outline" className="gap-1 py-1">
              {c.name}
              <button aria-label={`Quitar ${c.name}`} onClick={() => confirm(`¿Quitar «${c.name}» y sus votos?`) && run(() => delCat({ data: { id: c.id } }))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex max-w-sm gap-2">
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nueva categoría" />
          <Button variant="outline" disabled={!newCat.trim()} onClick={() => run(async () => { await addCat({ data: { contestId: id, name: newCat } }); setNewCat(""); })}>Añadir</Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Participantes ({d.entries.length})</h2>
          <Button onClick={() => setDraft({ id: null, name: "", photoUrl: "", categoryIds: d.categories.map((c) => c.id) })}><Plus className="mr-1 h-4 w-4" />Añadir participante</Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {d.entries.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-lg border bg-card">
              <img src={e.photo_url} alt={e.name} className="aspect-square w-full object-cover" />
              <div className="space-y-1 p-2">
                <div className="truncate text-sm font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.categoryIds.map((cid) => d.categories.find((c) => c.id === cid)?.name).filter(Boolean).join(" · ")}</div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setDraft({ id: e.id, name: e.name, photoUrl: e.photo_url, categoryIds: e.categoryIds })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => confirm(`¿Eliminar a ${e.name}?`) && run(() => delEntry({ data: { id: e.id } }))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg"><Trophy className="mr-1 inline h-5 w-5" />Clasificación <span className="text-sm text-muted-foreground">· {d.voterCount} votantes</span></h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {d.results.map((r) => (
            <div key={r.category_id} className="rounded-lg border bg-card p-3">
              <div className="mb-2 font-medium">{r.name}</div>
              <ol className="space-y-1 text-sm">
                {r.ranking.map((x, i) => (
                  <li key={x.entry_id} className="flex justify-between"><span>{i + 1}. {entryName(x.entry_id)}</span><span className="font-mono">{x.votes}</span></li>
                ))}
                {!r.ranking.length && <li className="text-muted-foreground">Sin participantes</li>}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-lg border bg-card p-4">
        <h2 className="font-display text-lg"><Gift className="mr-1 inline h-5 w-5" />Sorteo entre votantes</h2>
        {d.raffleWinner && <p className="text-2xl font-semibold text-primary">🎉 {d.raffleWinner}</p>}
        <Button onClick={() => (!d.raffleWinner || confirm("¿Repetir el sorteo? Se sustituirá el ganador actual.")) && run(() => raffle({ data: { id } }))} disabled={!d.voterCount}>
          {d.raffleWinner ? "Repetir sorteo" : "Generar sorteo"}
        </Button>
      </section>

      <Button variant="ghost" className="text-destructive" onClick={() => confirm("¿Eliminar el concurso con todos sus votos?") && del({ data: { id } }).then(onBack)}>
        <Trash2 className="mr-1 h-4 w-4" />Eliminar concurso
      </Button>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Editar participante" : "Nuevo participante"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-3">
              <ImagePicker url={draft.photoUrl} onChange={(u) => setDraft({ ...draft, photoUrl: u })} height="h-56" label="Subir foto" onUploadingChange={setUploading} />
              <div><Label>Nombre</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Participa en</Label>
                {d.categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={draft.categoryIds.includes(c.id)} onCheckedChange={(v) => setDraft({ ...draft, categoryIds: v ? [...draft.categoryIds, c.id] : draft.categoryIds.filter((x) => x !== c.id) })} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button disabled={!draft?.name.trim() || !draft?.photoUrl || !draft?.categoryIds.length || uploading}
              onClick={() => draft && run(async () => { await saveEntry({ data: { contestId: id, ...draft } }); setDraft(null); }, "Guardado")}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>QR de votación</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg border bg-white p-3">
              <QRCodeSVG value={url} size={208} marginSize={0} />
            </div>
            <p className="break-all text-center font-mono text-xs">{url}</p>
            <p className="text-center text-xs text-muted-foreground">Los votantes pueden escanear este código para ver a los participantes y votar.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
