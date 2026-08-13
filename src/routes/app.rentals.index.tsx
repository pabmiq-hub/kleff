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
import { upcomingGameNights, toISODate } from "@/lib/gameNights";
import { useAppLocale } from "@/i18n/app-i18n";
import { rentalsDict, localeToIntl } from "@/i18n/app/rentals";

export const Route = createFileRoute("/app/rentals/")({
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
  const { locale } = useAppLocale();
  const t = rentalsDict[locale];
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

  const weekdayName = t.weekdays[weekday] ?? "—";

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{t.catalog.pickupHint(weekdayName)}</p>

      <Input
        placeholder={t.catalog.searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground">{t.catalog.loading}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-card border-2 border-ink rounded-2xl p-8 text-center text-muted-foreground">
          {t.catalog.noResults}
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
  const { locale } = useAppLocale();
  const t = rentalsDict[locale];
  const intlLocale = localeToIntl(locale);
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
        toast.success(t.catalog.waitlistedToast(res.waitlistPosition));
      } else {
        toast.success(t.catalog.submittedToast);
      }
      setOpen(false);
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.catalog.genericError);
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
          {t.catalog.copiesTotal(game.total_copies ?? 1)}
        </p>
        <div className="mt-auto pt-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">{t.catalog.requestButton}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.catalog.requestTitle(game.title)}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.catalog.pickupNight}</Label>
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
                          {d.toLocaleDateString(intlLocale, { weekday: "short", day: "numeric", month: "short" })}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.catalog.returnLabel}: {(() => {
                      const ret = new Date(pickupISO);
                      ret.setDate(ret.getDate() + 7);
                      return ret.toLocaleDateString(intlLocale);
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>{t.catalog.messageLabel}</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.catalog.messagePlaceholder} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={acceptWaitlist} onCheckedChange={(v) => setAcceptWaitlist(v === true)} />
                  {t.catalog.waitlistCheckbox}
                </label>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? t.catalog.submitting : t.catalog.submit}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
