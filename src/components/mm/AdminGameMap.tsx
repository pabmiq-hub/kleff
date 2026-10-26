import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, ImageOff, Loader2, Map as MapIcon, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mmGenerateMapArt, mmGetGameMap } from "@/lib/mm/admin.functions";

/** "Mapa del castillo" section in the admin game sheet. Renders nothing when the game has no places. */
export function AdminGameMap({ gameId }: { gameId: string }) {
  const getMap = useServerFn(mmGetGameMap);
  const genArt = useServerFn(mmGenerateMapArt);
  const [map, setMap] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => getMap({ data: { gameId } }).then(setMap).catch(() => setMap(null)), [gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [load]);

  const generate = async (force: boolean) => {
    if (force && !confirm("¿Rehacer todos los dibujos del mapa? Se sustituirán los actuales.")) return;
    setBusy(true);
    try {
      const r = await genArt({ data: { gameId, force } });
      const msg = `${r.generated} dibujos creados, ${r.failed} fallidos${r.fallback ? " (se usa el plano de respaldo)" : ""}`;
      r.failed ? toast.warning(msg) : toast.success(msg);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!map || !map.locations.length) return null;
  const nFeat = map.features.length;
  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><MapIcon className="h-5 w-5" /> Mapa del castillo</h2>
      <p className="mb-3 text-sm text-ink/70">
        {map.locations.length} lugares, {nFeat} elementos, {map.missing} sin dibujo
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => generate(false)} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {busy ? "Generando dibujos…" : "Generar dibujos del mapa"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => generate(true)} disabled={busy}>
          <RefreshCw className="mr-2 h-4 w-4" /> Regenerar todos los dibujos
        </Button>
      </div>
      {map.map_url && <img src={map.map_url} alt="Plano" className="mb-4 w-full max-w-xl rounded-xl border border-ink/10" />}
      <div className="space-y-3">
        {map.locations.map((l: any) => (
          <div key={l.id} className="rounded-xl border border-ink/10 bg-card p-3">
            <p className="font-semibold">
              {l.name} <span className="text-xs font-normal text-ink/60">· {l.act ?? "Desde el inicio"}</span>
              {!l.has_image && <ImageOff className="ml-2 inline h-4 w-4 text-ink/50" aria-label="Sin dibujo" />}
            </p>
            <ul className="mt-2 space-y-1.5">
              {map.features
                .filter((f: any) => f.location_id === l.id)
                .map((f: any) => (
                  <li key={f.id} className="text-sm">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-ink/60">
                      {" "}· {f.act ?? "acto del lugar"}
                      {f.requires.character && ` · solo ${f.requires.character}`}
                      {f.requires.item && ` · objeto: ${f.requires.item}`}
                      {f.requires.ability && ` · habilidad: ${f.requires.ability}`}
                      {f.evidence && ` · prueba: ${f.evidence}`}
                    </span>
                    {!f.has_image && <ImageOff className="ml-1 inline h-3.5 w-3.5 text-ink/50" aria-label="Sin dibujo" />}
                    {f.warnings.map((w: string) => (
                      <p key={w} className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" /> {w}</p>
                    ))}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
