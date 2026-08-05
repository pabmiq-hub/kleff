import { createFileRoute } from "@tanstack/react-router";
import { PollCard, usePolls } from "@/components/app/PollCard";

export const Route = createFileRoute("/app/votaciones")({
  component: PollsPage,
});

function PollsPage() {
  const { polls, loading, reload } = usePolls();
  const active = polls.filter((p) => p.open);
  const past = polls.filter((p) => !p.open);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Encuestas y votaciones</h1>
        <p className="text-muted-foreground mt-1">
          Participa en las decisiones de KLEFF y gana karma por hacerlo.
        </p>
      </header>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : polls.length === 0 ? (
        <p className="text-muted-foreground">Ahora mismo no hay ninguna encuesta ni votación.</p>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">Abiertas</h2>
              {active.map((p) => (
                <PollCard key={p.id} poll={p} onDone={() => void reload()} />
              ))}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold">Historial</h2>
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
