import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRentalGames, createRentalRequest } from "@/server/rental.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/rentals")({
  component: RentalsCatalog,
});

interface Game {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  max_rental_days: number;
  is_active: boolean;
}

function RentalsCatalog() {
  const listFn = useServerFn(listRentalGames);
  const requestFn = useServerFn(createRentalRequest);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listFn({ data: undefined as never })
      .then((r) => setGames((r.games as Game[]).filter((g) => g.is_active)))
      .finally(() => setLoading(false));
  }, [listFn]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Alquilar juegos</h1>
        <p className="text-muted-foreground mt-1">Elige un juego y envía tu solicitud.</p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Cargando catálogo…</p>
      ) : games.length === 0 ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 text-center text-muted-foreground">
          Aún no hay juegos en el catálogo. Vuelve pronto.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} onRequest={requestFn} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  onRequest,
}: {
  game: Game;
  onRequest: ReturnType<typeof useServerFn<typeof createRentalRequest>>;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRequest({
        data: { gameId: game.id, requestedDays: days, message: message || null },
      });
      toast.success("Solicitud enviada. El equipo la revisará.");
      setOpen(false);
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border-2 border-ink rounded-2xl overflow-hidden shadow-tactile-sm flex flex-col">
      {game.image_url ? (
        <img src={game.image_url} alt={game.title} className="aspect-video object-cover w-full" />
      ) : (
        <div className="aspect-video bg-primary-soft flex items-center justify-center text-5xl">🎲</div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-lg">{game.title}</h3>
        {game.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{game.description}</p>}
        <p className="text-xs text-muted-foreground mt-2">Hasta {game.max_rental_days} días</p>
        <div className="mt-auto pt-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">Solicitar alquiler</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar "{game.title}"</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Días de alquiler</Label>
                  <Input
                    type="number"
                    min={1}
                    max={game.max_rental_days}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Máximo {game.max_rental_days} días.</p>
                </div>
                <div className="space-y-1">
                  <Label>Mensaje (opcional)</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cuéntanos cuándo lo recoges, etc." />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Enviando…" : "Enviar solicitud"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
