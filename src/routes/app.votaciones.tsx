import { createFileRoute } from "@tanstack/react-router";
import { PollCard, usePolls } from "@/components/app/PollCard";
import { useAppLocale } from "@/i18n/app-i18n";
import { pollsDict } from "@/i18n/app/polls";

export const Route = createFileRoute("/app/votaciones")({
  component: PollsPage,
});

function PollsPage() {
  const { locale } = useAppLocale();
  const t = pollsDict[locale].page;
  const { polls, loading, reload } = usePolls();
  const active = polls.filter((p) => p.open);
  const past = polls.filter((p) => !p.open);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">{t.loading}</p>
      ) : polls.length === 0 ? (
        <p className="text-muted-foreground">{t.empty}</p>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">{t.openSection}</h2>
              {active.map((p) => (
                <PollCard key={p.id} poll={p} onDone={() => void reload()} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">{t.historySection}</h2>
              {past.map((p) => (
                <PollCard key={p.id} poll={p} onDone={() => void reload()} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
