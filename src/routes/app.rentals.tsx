import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRentalGames, createRentalRequest, getRentalSettings } from "@/lib/rental.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LocationBadge, type LocationFields } from "@/components/ludoteca/LocationBadge";
import { upcomingGameNights, toISODate, weekdayLabel } from "@/lib/gameNights";

export const Route = createFileRoute("/app/rentals")({
  component: RentalsCatalog,
});

interface Game extends LocationFields {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  max_rental_days: number;
  is_active: boolean;
  total_copies: number | null;
}

function RentalsCatalog() {
  const listFn = useServerFn(listRentalGames);
  const requestFn = useServerFn(createRentalRequest);
  const settingsFn = useServerFn(getRentalSettings);
  const [games, setGames] = useState<Game[]>([]);
  const [weekday, setWeekday] = useState(3);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([listFn({ data: undefined as never }), settingsFn()])
      .then(([gs, st]) => {
        setGames((gs.games as Game[]).filter((g) => g.is_active));
        setWeekday(st.settings.game_night_weekday);
      })
      .finally(() => setLoading(false));
  }, [listFn, settingsFn]);

  const upcoming = useMemo(() => upcomingGameNights(weekday, 4), [weekday]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.title.toLowerCase().includes(q));
  }, [games, search]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Alquilar juegos</h1>
        <p className="text-muted-foreground mt-1">
          Recoges una noche de juego ({weekdayLabel(weekday)}) y devuelves el siguiente {weekdayLabel(weekday)}.
        </p>
      </header>

      <Input
        placeholder="Buscar juego…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground">Cargando catálogo…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 text-center text-muted-foreground">
          Sin resultados.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} upcoming={upcoming} onRequest={requestFn} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  upcoming,
  onRequest,
}: {
  game: Game;
  upcoming: Date[];
  onRequest: ReturnType<typeof useServerFn<typeof createRentalRequest>>;
}) {
  const [open, setOpen] = useState(false);
  const [pickupISO, setPickupISO] = useState(toISODate(upcoming[0]));
  const [acceptWaitlist, setAcceptWaitlist] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await onRequest({
        data: { gameId: game.id, pickupDate: pickupISO, message: message || null, acceptWaitlist },
      });
      if (res.status === "waitlisted") {
        toast.success(`Apuntado en lista de espera (#${res.waitlistPosition}).`);
      } else {
        toast.success("Solicitud enviada. El equipo la revisará.");
      }
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
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg">{game.title}</h3>
          <LocationBadge loc={game} />
        </div>
        {game.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{game.description}</p>}
        <p className="text-xs text-muted-foreground mt-2">
          {game.total_copies ?? 1} copia{(game.total_copies ?? 1) === 1 ? "" : "s"} en total
        </p>
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
                <div className="space-y-2">
                  <Label>Noche de recogida</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {upcoming.map((d) => {
                      const iso = toISODate(d);
                      const active = iso === pickupISO;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setPickupISO(iso)}
                          className={`text-left px-3 py-2 rounded-xl border-2 text-sm transition ${
                            active ? "bg-coral text-cream border-ink" : "bg-card border-ink/30 hover:border-ink"
                          }`}
                        >
                          {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Devolución: {(() => {
                      const ret = new Date(pickupISO);
                      ret.setDate(ret.getDate() + 7);
                      return ret.toLocaleDateString();
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Mensaje (opcional)</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cualquier nota para el equipo" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={acceptWaitlist} onCheckedChange={(v) => setAcceptWaitlist(v === true)} />
                  Si no hay copia, apúntame en lista de espera
                </label>
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
