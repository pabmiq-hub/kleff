import { createFileRoute } from "@tanstack/react-router";
import { useMyRentalsData, Empty, Row, CancelButton } from "@/components/app/rentals-mine";
import { useAppLocale } from "@/i18n/app-i18n";
import { rentalsDict, localeToIntl } from "@/i18n/app/rentals";

export const Route = createFileRoute("/app/rentals/requests")({
  component: RequestsPage,
});

function RequestsPage() {
  const { requests, loading, cancel } = useMyRentalsData();
  const { locale } = useAppLocale();
  const t = rentalsDict[locale];
  if (loading) return <p className="text-muted-foreground">{t.requests.loading}</p>;
  const pending = requests.filter((r) => r.status === "pending");
  return (
    <div className="space-y-2">
      {pending.length === 0 ? (
        <Empty msg={t.requests.empty} />
      ) : (
        pending.map((r) => (
          <Row
            key={r.id}
            title={r.bgg_games?.title ?? t.gameFallback}
            img={r.bgg_games?.image_url}
            sub={t.requests.daysAndSent(r.requested_days, new Date(r.created_at).toLocaleDateString(localeToIntl(locale)))}
            badge={t.requests.pending}
            action={<CancelButton onCancel={() => cancel(r.id)} />}
          />
        ))
      )}
    </div>
  );
}
