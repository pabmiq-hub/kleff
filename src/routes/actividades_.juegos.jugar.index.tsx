import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MMShell } from "@/components/mm/shared";
import { mmPlayerLogin } from "@/lib/mm/player.functions";

export const Route = createFileRoute("/actividades_/juegos/jugar/")({
  head: () => ({
    meta: [
      { title: "Entrar a jugar — KLEFF Murder Mystery" },
      { name: "description", content: "Introduce tu código personal para entrar en la partida de misterio." },
      { property: "og:title", content: "Entrar a jugar — KLEFF" },
      { property: "og:description", content: "Introduce tu código personal para jugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const login = useServerFn(mmPlayerLogin);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <MMShell>
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="text-center text-3xl font-extrabold text-[var(--mm-accent)]" style={{ fontFamily: "var(--mm-font)" }}>Entrar a la partida</h1>
        <p className="mt-2 text-center text-sm opacity-70">Escribe tu código personal (ej. LUNA-7K4P)</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            setBusy(true);
            try {
              const r = await login({ data: { code } });
              localStorage.setItem(`mm-token-${r.sessionId}`, r.token);
              void navigate({ to: "/actividades/juegos/jugar/$sessionId", params: { sessionId: r.sessionId } });
            } catch (e2) {
              setErr((e2 as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="off" placeholder="PALABRA-XXXX" className="w-full rounded-xl bg-[var(--mm-surface)] p-4 text-center font-mono text-2xl tracking-widest" />
          {err && <p className="text-center text-sm text-[var(--mm-primary)]">{err}</p>}
          <button disabled={busy || code.length < 4} className="w-full rounded-xl bg-[var(--mm-primary)] py-3 font-semibold disabled:opacity-50">{busy ? "Entrando…" : "Entrar"}</button>
        </form>
      </div>
    </MMShell>
  );
}
