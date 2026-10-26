import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MMShell } from "@/components/mm/shared";
import { mmGetJoinInfo, mmJoinSession } from "@/lib/mm/player.functions";

export const Route = createFileRoute("/actividades_/juegos/unirse/$sessionId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Únete a la partida — KLEFF Murder Mystery" },
      { name: "description", content: "Apúntate a la partida con tu nombre y tu correo y recibe tu código personal." },
      { property: "og:title", content: "Únete a una partida de misterio" },
      { property: "og:description", content: "Apúntate y recibe tu personaje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Join,
});

const TXT: Record<string, Record<string, string>> = {
  es: {
    gone: "Esta partida no existe o el enlace no es válido.",
    closed: "Las inscripciones para esta partida están cerradas.",
    full: "La partida está completa.",
    name: "Tu nombre",
    email: "Tu correo electrónico",
    join: "Apuntarme",
    done: "¡Listo! Este es tu código personal. También te lo hemos enviado por email.",
    go: "Ir a mi panel",
    next: "Al entrar, pulsa «Confirmo que asistiré». Te enviaremos tu personaje unas 24 h antes.",
    spots: "Quedan {n} plazas",
    players: "{min}–{max} jugadores · {mins} min",
  },
  ca: {
    gone: "Aquesta partida no existeix o l'enllaç no és vàlid.",
    closed: "Les inscripcions per a aquesta partida estan tancades.",
    full: "La partida és completa.",
    name: "El teu nom",
    email: "El teu correu electrònic",
    join: "Apuntar-m'hi",
    done: "Fet! Aquest és el teu codi personal. També te l'hem enviat per correu.",
    go: "Anar al meu panell",
    next: "En entrar, prem «Confirmo que hi assistiré». T'enviarem el personatge unes 24 h abans.",
    spots: "Queden {n} places",
    players: "{min}–{max} jugadors · {mins} min",
  },
  en: {
    gone: "This game doesn't exist or the link is not valid.",
    closed: "Registration for this game is closed.",
    full: "The game is full.",
    name: "Your name",
    email: "Your email address",
    join: "Sign me up",
    done: "Done! This is your personal code. We've also emailed it to you.",
    go: "Go to my panel",
    next: "Once inside, tap “I confirm I'll attend”. We'll send your character about 24 h before.",
    spots: "{n} spots left",
    players: "{min}–{max} players · {mins} min",
  },
};

function Join() {
  const { sessionId } = Route.useParams();
  const get = useServerFn(mmGetJoinInfo);
  const join = useServerFn(mmJoinSession);
  const navigate = useNavigate();
  const [info, setInfo] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<{ code: string; sessionId: string } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const x = TXT[info?.language === "fr" ? "en" : info?.language] ?? TXT.es;
  const fill = (s: string, v: Record<string, unknown>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

  useEffect(() => {
    get({ data: { sessionId } }).then(setInfo).catch((e) => setErr(e.message));
  }, [sessionId]);

  const g = info?.game;
  return (
    <MMShell theme={g?.theme}>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        {!info && !err && <p className="text-center opacity-70">Cargando…</p>}
        {info && !info.found && <p className="text-center">{x.gone}</p>}
        {info?.found && !done && (
          <>
            <p className="text-center text-xs uppercase tracking-widest opacity-70">{info.session_name}</p>
            <h1 className="mt-1 text-center text-3xl font-extrabold text-[var(--mm-accent)]" style={{ fontFamily: "var(--mm-font)" }}>{g.title}</h1>
            {g.cover_url && <img src={g.cover_url} alt={g.title} className="mt-4 w-full rounded-2xl object-cover" />}
            <p className="mt-3 text-center text-xs uppercase tracking-wide opacity-60">
              {fill(x.players, { min: g.min_players, max: g.max_players, mins: g.duration_minutes })}
              {g.genre ? ` · ${g.genre}` : ""}
            </p>
            {g.synopsis && <p className="mt-3 text-center text-sm opacity-80">{g.synopsis}</p>}
            {!info.open ? (
              <p className="mt-6 text-center">{x.closed}</p>
            ) : info.spots_left <= 0 ? (
              <p className="mt-6 text-center">{x.full}</p>
            ) : (
              <form
                className="mt-6 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr("");
                  setBusy(true);
                  try {
                    const r = await join({ data: { sessionId, displayName: name, email } });
                    localStorage.setItem(`mm-token-${r.sessionId}`, r.token);
                    setDone(r);
                  } catch (e2) {
                    setErr((e2 as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <p className="text-center text-xs opacity-70">{fill(x.spots, { n: info.spots_left })}</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={x.name} className="w-full rounded-xl bg-[var(--mm-surface)] p-3" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={x.email} type="email" className="w-full rounded-xl bg-[var(--mm-surface)] p-3" />
                <button disabled={busy || !name.trim() || !email.trim()} className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-50">
                  {busy ? "…" : x.join}
                </button>
              </form>
            )}
          </>
        )}
        {done && (
          <div className="text-center">
            <p className="opacity-80">{x.done}</p>
            <p className="mt-2 text-sm opacity-70">{x.next}</p>
            <p className="my-6 rounded-xl bg-[var(--mm-surface)] p-4 font-mono text-3xl tracking-widest text-[var(--mm-accent)]">{done.code}</p>
            <button onClick={() => navigate({ to: "/actividades/juegos/jugar/$sessionId", params: { sessionId: done.sessionId } })} className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold">
              {x.go}
            </button>
          </div>
        )}
        {err && <p className="mt-4 text-center text-sm text-[var(--mm-primary)]">{err}</p>}
      </div>
    </MMShell>
  );
}
