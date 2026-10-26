import { useState } from "react";
import { Lock, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { pinPosition } from "@/lib/mm/map-art";

type Feature = { id: string; name: string; teaser: string | null; locked: boolean; locked_hint: string | null; read: boolean; content: string | null; image_url: string | null; evidence_title: string | null };
type Location = { id: string; name: string; description: string | null; x: number; y: number; image_url: string | null; features: Feature[]; pending: number };

export function MapTab({ map, consult, readOnly }: { map: { map_url: string | null; locations: Location[] }; consult?: (featureId: string) => Promise<{ content: string; image_url: string | null; evidence_title: string | null }>; readOnly?: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; content: string; image_url: string | null; evidence_title: string | null } | null>(null);
  const open = map.locations.find((l) => l.id === openId) ?? null;

  const examine = async (f: Feature) => {
    if (!consult) return;
    setBusy(f.id);
    try {
      const r = await consult(f.id);
      setResult({ name: f.name, ...r });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!map.locations.length) return <p className="py-8 text-center text-sm opacity-70">Todavía no hay lugares que explorar.</p>;

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--mm-accent)]/30 bg-[var(--mm-surface)]" style={{ aspectRatio: "640 / 400" }}>
        {map.map_url && <img src={map.map_url} alt="Plano del lugar" className="absolute inset-0 h-full w-full" />}
        {map.locations.map((l) => {
          const p = pinPosition(l.x, l.y);
          return (
            <button
              key={l.id}
              onClick={() => setOpenId(l.id)}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shadow-md ${openId === l.id ? "bg-[var(--mm-accent)] text-[var(--mm-bg)]" : "bg-[var(--mm-primary)] text-[var(--mm-text)]"}`}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              aria-label={l.name}
            >
              <MapPin className="h-3 w-3" />
              {l.pending > 0 && <span>{l.pending}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {map.locations.map((l) => (
          <button key={l.id} onClick={() => setOpenId(l.id)} className={`rounded-full border px-3 py-1 text-xs ${openId === l.id ? "border-[var(--mm-accent)] bg-[var(--mm-accent)]/15" : "border-[var(--mm-accent)]/30"}`}>
            {l.name}
            {l.pending > 0 && <span className="ml-1 rounded-full bg-[var(--mm-primary)] px-1.5 text-[10px]">{l.pending}</span>}
          </button>
        ))}
      </div>

      {open && (
        <section className="space-y-3 rounded-xl bg-[var(--mm-surface)] p-4">
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: "var(--mm-font)" }}>{open.name}</h3>
            {open.description && <p className="text-sm opacity-80">{open.description}</p>}
          </div>
          {open.image_url && <img src={open.image_url} alt={open.name} className="w-full rounded-lg" loading="lazy" />}
          {open.features.length === 0 && <p className="text-sm opacity-70">No hay nada que examinar aquí por ahora.</p>}
          {open.features.map((f) => (
            <article key={f.id} className="rounded-lg border border-[var(--mm-accent)]/20 p-3">
              <p className="flex items-center gap-1.5 font-semibold">
                {f.locked && <Lock className="h-4 w-4 opacity-70" />}
                {f.name}
              </p>
              {f.read ? (
                <>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{f.content}</p>
                  {f.image_url && <img src={f.image_url} alt={f.name} className="mt-2 w-full rounded" loading="lazy" />}
                  {f.evidence_title && <p className="mt-2 text-xs text-[var(--mm-accent)]">Has recibido: {f.evidence_title}</p>}
                </>
              ) : (
                <>
                  {f.teaser && <p className="mt-1 text-sm opacity-80">{f.teaser}</p>}
                  {f.locked ? (
                    <p className="mt-1 text-xs italic opacity-70">{f.locked_hint}</p>
                  ) : (
                    !readOnly && (
                      <button disabled={busy === f.id} onClick={() => examine(f)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--mm-primary)] px-3 py-1.5 text-sm disabled:opacity-60">
                        <Search className="h-4 w-4" /> {busy === f.id ? "Examinando…" : "Examinar"}
                      </button>
                    )
                  )}
                </>
              )}
            </article>
          ))}
        </section>
      )}

      {result && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setResult(null)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-[var(--mm-bg)] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--mm-font)" }}>{result.name}</h3>
              <button onClick={() => setResult(null)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </div>
            {result.image_url && <img src={result.image_url} alt={result.name} className="mb-3 w-full rounded" />}
            <p className="whitespace-pre-wrap text-sm">{result.content}</p>
            {result.evidence_title && <p className="mt-3 rounded bg-[var(--mm-accent)]/15 p-2 text-sm">Has recibido: {result.evidence_title}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
