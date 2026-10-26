import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, ImageOff, Loader2, RefreshCw, Search, Sparkles, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ART_KIND_LABEL, type GameArtEntry } from "@/lib/mm/art-gallery";
import { mmGetGameArt, mmRegenerateGameArt } from "@/lib/mm/admin.functions";

const keyOf = (art: GameArtEntry) => `${art.kind}:${art.id}`;

export function AdminArtGallery({ gameId }: { gameId: string }) {
  const get = useServerFn(mmGetGameArt);
  const regenerate = useServerFn(mmRegenerateGameArt);
  const [art, setArt] = useState<GameArtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setArt(await get({ data: { gameId } }));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [gameId, get]);
  useEffect(() => { void load(); }, [load]);

  const redraw = async (entry: GameArtEntry) => {
    if (busy) return;
    if (entry.image_url && !confirm(`¿Regenerar «${entry.name}» con Gemini? Se sustituirá solo esta imagen.`)) return;
    setBusy(keyOf(entry));
    try {
      await regenerate({ data: { gameId, kind: entry.kind, artId: entry.id } });
      toast.success("Ilustración guardada");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p role="status" className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando ilustraciones…</p>;
  if (error) return <div role="alert" className="space-y-3 py-8"><p>No se han podido cargar las ilustraciones.</p><Button variant="outline" onClick={() => void load()}><RefreshCw /> Reintentar</Button></div>;
  return <ArtGalleryView art={art} busy={busy} onRegenerate={(entry) => void redraw(entry)} />;
}

/** Pure view, separated from privileged reads and writes. */
export function ArtGalleryView({ art, busy, onRegenerate }: { art: GameArtEntry[]; busy: string | null; onRegenerate: (entry: GameArtEntry) => void }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const visible = useMemo(() => art.filter((entry) => {
    const text = `${entry.name} ${entry.context ?? ""}`.toLocaleLowerCase("es");
    return (kind === "all" || kind === entry.kind) && (status === "all" || (status === "missing" ? !entry.image_url : !!entry.image_url)) && text.includes(search.trim().toLocaleLowerCase("es"));
  }), [art, kind, search, status]);
  const selected = art.find((entry) => keyOf(entry) === selectedKey);
  const index = visible.findIndex((entry) => keyOf(entry) === selectedKey);
  const move = (delta: number) => {
    const next = visible[index + delta];
    if (next) setSelectedKey(keyOf(next));
  };
  const missing = art.filter((entry) => !entry.image_url).length;

  return (
    <TooltipProvider delayDuration={200}>
      <section className="space-y-5" aria-label="Galería de ilustraciones">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xl font-semibold">Ilustraciones</h2>
          <p className="text-sm text-muted-foreground">{art.length - missing} con imagen · {missing} pendientes</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Buscar ilustraciones" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, personaje o sala…" className="pl-9" />
          </div>
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger aria-label="Tipo de ilustración" className="sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><span>Todos los tipos ({art.length})</span></SelectItem>
              {Object.entries(ART_KIND_LABEL).map(([value, label]) => <SelectItem key={value} value={value}><span>{label} ({art.filter((a) => a.kind === value).length})</span></SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Estado de las imágenes" className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><span>Todas las imágenes</span></SelectItem>
              <SelectItem value="ready"><span>Con imagen</span></SelectItem>
              <SelectItem value="missing"><span>Pendientes ({missing})</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visible.length === 0 ? <p className="py-12 text-center text-muted-foreground">{art.length ? "No hay ilustraciones con estos filtros." : "Este juego todavía no tiene objetos, evidencias ni lugares."}</p> : (
          <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((entry) => (
              <article key={keyOf(entry)} className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
                <Button variant="ghost" className="group relative h-auto w-full rounded-none p-0" aria-label={`Ampliar ${entry.name}`} onClick={() => setSelectedKey(keyOf(entry))}>
                  <ArtImage entry={entry} />
                  {entry.image_url && <span className="absolute right-2 top-2 rounded-md border border-border bg-background p-1.5 text-foreground opacity-80 transition-opacity group-hover:opacity-100"><ZoomIn className="h-4 w-4" /></span>}
                </Button>
                <div className="space-y-1.5 p-3">
                  <p className="text-xs text-muted-foreground">{ART_KIND_LABEL[entry.kind]}</p>
                  <h3 className="min-h-10 break-words text-sm font-semibold leading-5">{entry.name}</h3>
                  <p className="min-h-8 break-words text-xs text-muted-foreground">{entry.context ?? ""}</p>
                  <Button variant="outline" size="sm" className="w-full" disabled={!!busy} onClick={() => onRegenerate(entry)}>
                    {busy === keyOf(entry) ? <Loader2 className="animate-spin" /> : entry.image_url ? <RefreshCw /> : <Sparkles />}
                    {busy === keyOf(entry) ? "Generando…" : entry.image_url ? "Regenerar" : "Generar imagen"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
        <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelectedKey(null); }}>
          {selected && <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto" onKeyDown={(e) => { if (e.key === "ArrowLeft") move(-1); if (e.key === "ArrowRight") move(1); }}>
            <DialogHeader className="pr-6">
              <DialogTitle className="break-words leading-6">{selected.name}</DialogTitle>
              <DialogDescription className="break-words">{ART_KIND_LABEL[selected.kind]}{selected.context ? ` · ${selected.context}` : ""}</DialogDescription>
            </DialogHeader>
            <ArtImage entry={selected} enlarged />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Imagen anterior" disabled={index <= 0} onClick={() => move(-1)}><ChevronLeft /></Button></TooltipTrigger><TooltipContent>Imagen anterior</TooltipContent></Tooltip>
                <span className="min-w-12 text-center text-sm text-muted-foreground">{index + 1} / {visible.length}</span>
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Imagen siguiente" disabled={index < 0 || index >= visible.length - 1} onClick={() => move(1)}><ChevronRight /></Button></TooltipTrigger><TooltipContent>Imagen siguiente</TooltipContent></Tooltip>
              </div>
              <Button variant="outline" disabled={!!busy} onClick={() => onRegenerate(selected)}>
                {busy === keyOf(selected) ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {busy === keyOf(selected) ? "Generando…" : selected.image_url ? "Regenerar con Gemini" : "Generar con Gemini"}
              </Button>
            </div>
          </DialogContent>}
        </Dialog>
      </section>
    </TooltipProvider>
  );
}

function ArtImage({ entry, enlarged = false }: { entry: GameArtEntry; enlarged?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [entry.image_url]);
  const image = entry.image_url && !failed;
  return <div className={`flex w-full items-center justify-center bg-muted ${enlarged ? "h-[min(55dvh,32rem)] rounded-md" : "aspect-[4/3]"}`}>
    {image ? <img src={entry.image_url ?? undefined} alt={entry.name} loading={enlarged ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain p-3" onError={() => setFailed(true)} /> : <div className="flex flex-col items-center gap-2 px-2 text-center text-muted-foreground"><ImageOff className="h-8 w-8" /><span className="text-xs">{failed ? "Imagen no disponible" : "Sin ilustración"}</span></div>}
  </div>;
}