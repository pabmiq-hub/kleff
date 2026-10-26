import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MMShell, sessionTopicName, useBroadcast } from "@/components/mm/shared";
import { PlayerView } from "@/components/mm/PlayerView";
import { mmConsultFeature, mmPlayerAction, mmPlayerState } from "@/lib/mm/player.functions";
import { mmInteract } from "@/lib/mm/interaction.functions";

export const Route = createFileRoute("/actividades_/juegos/jugar/$sessionId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Partida en curso — KLEFF Murder Mystery" },
      { name: "description", content: "Tu panel de jugador: personaje, secretos, objetivos y evidencias." },
      { property: "og:title", content: "Partida en curso — KLEFF" },
      { property: "og:description", content: "Panel privado del jugador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Play,
});

function Play() {
  const { sessionId } = Route.useParams();
  const getState = useServerFn(mmPlayerState);
  const doAction = useServerFn(mmPlayerAction);
  const interact = useServerFn(mmInteract);
  const consultFn = useServerFn(mmConsultFeature);
  const [state, setState] = useState<any>(null);
  const [err, setErr] = useState("");
  const key = `mm-token-${sessionId}`;

  const load = useCallback(async () => {
    const token = localStorage.getItem(key);
    if (!token) return setErr("Necesitas tu código para entrar.");
    try {
      const r = await getState({ data: { token, sessionId } });
      localStorage.setItem(key, r.token);
      setState(r);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);
  useBroadcast(state ? sessionTopicName(sessionId) : null, () => void load());

  const run = async (data: Record<string, unknown>) => {
    try {
      await doAction({ data: { token: localStorage.getItem(key) ?? "", sessionId, ...data } as any });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (err && !state)
    return (
      <MMShell>
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <div>
            <p>{err}</p>
            <Link to="/actividades/juegos/jugar" className="mt-4 inline-block rounded-xl bg-[var(--mm-primary)] px-5 py-3">Introducir código</Link>
          </div>
        </div>
      </MMShell>
    );
  if (!state) return <MMShell><div className="grid min-h-screen place-items-center opacity-70">Cargando…</div></MMShell>;
  return (
    <PlayerView
      state={state}
      actions={{
        confirm: () => run({ action: "confirm" }),
        ready: () => run({ action: "ready" }),
        toggleObjective: (objectiveId) => run({ action: "toggle_objective", objectiveId }),
        vote: (v) => run({ action: "vote", ...v }),
        consult: async (featureId) => {
          const r = await consultFn({ data: { token: localStorage.getItem(key) ?? "", sessionId, featureId } });
          await load();
          return r;
        },
        interact: async (data) => {
          await interact({ data: { token: localStorage.getItem(key) ?? "", sessionId, ...data } });
          await load();
        },
      }}
    />
  );
}
