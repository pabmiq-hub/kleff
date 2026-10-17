import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MMShell } from "@/components/mm/shared";
import { mmGetInvitation, mmRegisterInvitation } from "@/lib/mm/player.functions";

export const Route = createFileRoute("/actividades_/juegos/invitacion/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Invitación a una partida — KLEFF Murder Mystery" },
      { name: "description", content: "Acepta tu invitación y recibe tu personaje y tu código personal." },
      { property: "og:title", content: "Te han invitado a una partida de misterio" },
      { property: "og:description", content: "Regístrate para recibir tu personaje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Invite,
});

const TXT: Record<string, Record<string, string>> = {
  es: { gone: "Esta invitación no existe o ha caducado.", already: "Ya estás registrado: entra con tu código", over: "Esta partida ya ha terminado.", name: "Tu nombre", accept: "Aceptar invitación", done: "¡Listo! Este es tu código personal. También te lo hemos enviado por email.", go: "Ir a mi panel", next: "Al entrar, pulsa «Confirmo que asistiré». Te enviaremos tu personaje unas 24 h antes." },
  ca: { gone: "Aquesta invitació no existeix o ha caducat.", already: "Ja estàs registrat: entra amb el teu codi", over: "Aquesta partida ja ha acabat.", name: "El teu nom", accept: "Acceptar invitació", done: "Fet! Aquest és el teu codi personal. També te l'hem enviat per correu.", go: "Anar al meu panell", next: "En entrar, prem «Confirmo que hi assistiré». T'enviarem el personatge unes 24 h abans." },
  en: { gone: "This invitation doesn't exist or has expired.", already: "You're already registered: log in with your code", over: "This game has already finished.", name: "Your name", accept: "Accept invitation", done: "Done! This is your personal code. We've also emailed it to you.", go: "Go to my panel", next: "Once inside, tap “I confirm I'll attend”. We'll send your character about 24 h before." },
};

function Invite() {
  const { token } = Route.useParams();
  const get = useServerFn(mmGetInvitation);
  const register = useServerFn(mmRegisterInvitation);
  const navigate = useNavigate();
  const [inv, setInv] = useState<any>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState<{ code: string; sessionId: string } | null>(null);
  const [err, setErr] = useState("");
  const x = TXT[inv?.language === "fr" ? "en" : inv?.language] ?? TXT.es;
  useEffect(() => {
    get({ data: { token } }).then(setInv).catch((e) => setErr(e.message));
  }, [token]);

  return (
    <MMShell theme={inv?.game?.theme}>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
        {!inv && !err && <p className="text-center opacity-70">Cargando…</p>}
        {inv && !inv.found && <p className="text-center">{x.gone}</p>}
        {inv?.found && !done && (
          <>
            <p className="text-center text-xs uppercase tracking-widest opacity-70">{inv.session_name}</p>
            <h1 className="mt-1 text-center text-3xl font-extrabold text-[var(--mm-accent)]" style={{ fontFamily: "var(--mm-font)" }}>{inv.game.title}</h1>
            {inv.game.synopsis && <p className="mt-4 text-center text-sm opacity-80">{inv.game.synopsis}</p>}
            {inv.registered ? (
              <button onClick={() => navigate({ to: "/actividades/juegos/jugar" })} className="mt-6 rounded-xl bg-[var(--mm-primary)] py-3 font-semibold">{x.already}</button>
            ) : inv.finished ? (
              <p className="mt-6 text-center">{x.over}</p>
            ) : (
              <form
                className="mt-6 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr("");
                  try {
                    const r = await register({ data: { token, displayName: name } });
                    localStorage.setItem(`mm-token-${r.sessionId}`, r.token);
                    setDone(r);
                  } catch (e2) {
                    setErr((e2 as Error).message);
                  }
                }}
              >
                <p className="text-center text-sm opacity-70">{inv.email}</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={x.name} className="w-full rounded-xl bg-[var(--mm-surface)] p-3" />
                <button disabled={!name.trim()} className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-50">{x.accept}</button>
              </form>
            )}
          </>
        )}
        {done && (
          <div className="text-center">
            <p className="opacity-80">{x.done}</p><p className="mt-2 text-sm opacity-70">{x.next}</p>
            <p className="my-6 rounded-xl bg-[var(--mm-surface)] p-4 font-mono text-3xl tracking-widest text-[var(--mm-accent)]">{done.code}</p>
            <button onClick={() => navigate({ to: "/actividades/juegos/jugar/$sessionId", params: { sessionId: done.sessionId } })} className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold">{x.go}</button>
          </div>
        )}
        {err && <p className="mt-4 text-center text-sm text-[var(--mm-primary)]">{err}</p>}
        <p className="mt-10 text-center text-[10px] opacity-50">Avatares: «Avataaars» de Pablo Stanley, vía DiceBear.</p>
      </div>
    </MMShell>
  );
}
