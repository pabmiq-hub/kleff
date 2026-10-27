import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mmSetSessionSlug } from "@/lib/mm/session-links.functions";
import { sessionJoinPath, sessionSlugSchema } from "@/lib/mm/session-links";

export function AdminSessionLink({ session, onSaved, onToggle }: { session: { id: string; join_slug?: string | null; join_enabled: boolean }; onSaved: () => Promise<unknown>; onToggle: (open: boolean) => Promise<void> }) {
  const save = useServerFn(mmSetSessionSlug);
  const [origin, setOrigin] = useState("");
  const [slug, setSlug] = useState(session.join_slug ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => { setSlug(session.join_slug ?? ""); setError(""); }, [session.join_slug]);
  const parsed = sessionSlugSchema.safeParse(slug);
  const changed = parsed.success ? parsed.data !== session.join_slug : slug !== (session.join_slug ?? "");
  const currentUrl = origin + sessionJoinPath(session.id, session.join_slug);
  return (
    <div className="space-y-3 border-l-2 border-primary pl-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <p className="min-w-0 text-sm font-semibold">Enlace público de inscripción</p>
        <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" checked={!!session.join_enabled} onChange={(e) => void onToggle(e.target.checked)} />Abierto</label>
      </div>
      <form className="space-y-2" onSubmit={async (e) => {
        e.preventDefault();
        if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enlace no válido."); return; }
        setBusy(true); setError("");
        try {
          const result = await save({ data: { sessionId: session.id, slug: parsed.data } });
          setSlug(result.slug); await onSaved(); toast.success("Enlace guardado");
        } catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="session-link-slug" className="block text-sm">Nombre del enlace</label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="flex min-w-0 items-center rounded-md border border-input bg-background pl-2">
            <span className="shrink-0 text-xs text-muted-foreground">/j/</span>
            <Input id="session-link-slug" value={slug} onChange={(e) => { setSlug(e.target.value); setError(""); }} maxLength={80} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="dracula-viernes" disabled={busy} aria-invalid={!!error} aria-describedby={error ? "session-link-error" : undefined} className="min-w-0 border-0 font-mono text-sm shadow-none" />
          </div>
          <Button type="submit" variant="outline" disabled={busy || !changed}><Save className="h-4 w-4" />{busy ? "Guardando…" : "Guardar"}</Button>
        </div>
        {error && <p id="session-link-error" role="alert" className="text-sm text-destructive">{error}</p>}
      </form>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Input aria-label="Enlace de inscripción" readOnly value={currentUrl} onFocus={(e) => e.target.select()} className="min-w-0 font-mono text-xs" />
        <Button type="button" variant="outline" title="Copiar enlace de inscripción" aria-label="Copiar enlace de inscripción" onClick={async () => {
          try { await navigator.clipboard.writeText(currentUrl); toast.success("Enlace copiado"); }
          catch { toast.error("No se ha podido copiar el enlace."); }
        }}><Copy className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}