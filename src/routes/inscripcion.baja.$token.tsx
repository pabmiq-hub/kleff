import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cancelRegistration, getCancellationInfo } from "@/lib/registrations.functions";
import { formatMadrid } from "@/lib/registrations-calendar";

export const Route = createFileRoute("/inscripcion/baja/$token")({
  head: () => ({
    meta: [
      { title: "Anular inscripción · KLEFF" },
      { name: "description", content: "Anula tu plaza en una actividad de KLEFF." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Anular inscripción · KLEFF" },
      { property: "og:description", content: "Anula tu plaza en una actividad de KLEFF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CancelPage,
});

type Info = Awaited<ReturnType<typeof getCancellationInfo>>;

function CancelPage() {
  const { token } = Route.useParams();
  const infoFn = useServerFn(getCancellationInfo);
  const cancelFn = useServerFn(cancelRegistration);
  const [info, setInfo] = useState<Info | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    let alive = true;
    infoFn({ data: { token } })
      .then((r) => {
        if (!alive) return;
        setInfo(r as Info);
        if ((r as { cancelled?: boolean }).cancelled) setCancelled(true);
      })
      .catch(() => { if (alive) setInfo({ found: false } as Info); });
    return () => { alive = false; };
  }, [token, infoFn]);

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelFn({ data: { token } });
      setCancelled(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="max-w-xl mx-auto px-6 py-16">
        {!info ? (
          <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
        ) : !info.found ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-center">
            <h1 className="font-display text-2xl mb-2 text-foreground">Enlace no válido</h1>
            <p className="text-muted-foreground">No hemos encontrado esta inscripción. Escríbenos a hola@kleff.es si necesitas ayuda.</p>
          </div>
        ) : cancelled ? (
          <div className="rounded-lg border border-coral/30 bg-coral/5 p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-coral mx-auto mb-3" />
            <h1 className="font-display text-2xl mb-2 text-foreground">Inscripción anulada</h1>
            <p className="text-muted-foreground">Hemos liberado tu plaza en «{info.title}». ¡Nos vemos en la próxima!</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-6">
            <h1 className="font-display text-2xl mb-2 text-foreground">¿Anular tu inscripción?</h1>
            <p className="text-muted-foreground mb-4">Vas a liberar tu plaza en «{info.title}».</p>
            <div className="space-y-1.5 text-sm text-foreground/80 mb-6">
              {info.eventDate && <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-coral" /> {formatMadrid(info.eventDate)}</p>}
              {info.eventLocation && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-coral" /> {info.eventLocation}</p>}
              {info.guests > 0 && <p>Incluye {info.guests} invitado{info.guests === 1 ? "" : "s"}.</p>}
            </div>
            <Button onClick={doCancel} disabled={busy} className="bg-coral hover:bg-coral/90 text-white">
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Sí, anular mi inscripción
            </Button>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
