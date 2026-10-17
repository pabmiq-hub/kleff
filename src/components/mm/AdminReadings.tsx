import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminReadings({ state }: { state: any }) {
  const acts = state.acts_full ?? [];
  const readings = state.readings ?? [];
  const initial = state.session.act?.key ?? acts[0]?.key;
  if (!initial) return null;
  return (
    <section className="space-y-3 border-t border-border pt-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5" /> Lecturas en voz alta</h2>
      <Tabs defaultValue={initial}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          {acts.map((a: any) => <TabsTrigger key={a.key} value={a.key} className="whitespace-normal text-left">{a.position}. {a.name}</TabsTrigger>)}
        </TabsList>
        {acts.map((a: any) => (
          <TabsContent key={a.key} value={a.key} className="space-y-3">
            {readings.filter((r: any) => r.act === a.key).map((r: any) => (
              <article key={r.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
                <h3 className="break-words font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Lee: {r.reader_name}{r.player_name ? ` · ${r.player_name}` : ""}</p>
                <p className="text-xs text-muted-foreground">{r.trigger === "final_reveal" ? "Al finalizar y revelar la solución" : r.trigger === "murder" ? "Tras el asesinato" : "Al comenzar el acto"}</p>
                {r.missing_reader && <p role="status" className="mt-2 text-sm text-destructive">Sin jugador asignado: debe leerlo el anfitrión o cubrirse el personaje.</p>}
                {r.text === null ? <p className="mt-3 text-sm text-muted-foreground">Texto oculto en modo ciego.</p> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{r.text}</p>}
              </article>
            ))}
            {!readings.some((r: any) => r.act === a.key) && <p className="py-3 text-sm text-muted-foreground">No hay lecturas para este acto.</p>}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}