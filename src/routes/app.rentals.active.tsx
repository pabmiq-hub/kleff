import { createFileRoute } from "@tanstack/react-router";
import { useMyRentalsData, Empty, Row, useStatusLabel } from "@/components/app/rentals-mine";
import { useAppLocale } from "@/i18n/app-i18n";
import { rentalsDict, localeToIntl } from "@/i18n/app/rentals";

export const Route = createFileRoute("/app/rentals/active")({
  component: ActivePage,
});

function ActivePage() {
  const { rentals, loading } = useMyRentalsData();
  const { locale } = useAppLocale();
  const t = rentalsDict[locale];
  const statusLabel = useStatusLabel(locale);
  if (loading) return <p className="text-muted-foreground">{t.active.loading}</p>;
  const active = rentals.filter((r) => r.status === "active" || r.status === "overdue");
  return (
    <div className="space-y-2">
      {active.length === 0 ? (
        <Empty msg={t.active.empty} />
      ) : (
        active.map((r) => (
          <Row
            key={r.id}
            title={r.bgg_games?.title ?? t.gameFallback}
            img={r.bgg_games?.image_url}
            sub={`${t.active.returnLabel}: ${new Date(r.due_at).toLocaleDateString(localeToIntl(locale))}`}
            badge={statusLabel[r.status]}
          />
        ))
      )}
    </div>
  );
}
