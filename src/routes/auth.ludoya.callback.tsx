import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { completeLudoyaLink } from "@/lib/ludoya-oidc.functions";

export const Route = createFileRoute("/auth/ludoya/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vinculando con Ludoya — KLEFF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LudoyaCallback,
});

function LudoyaCallback() {
  const [message, setMessage] = useState("Vinculando tu cuenta de Ludoya…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (ok: boolean, error?: string) => {
      window.opener?.postMessage(
        { type: ok ? "ludoyaLinkComplete" : "ludoyaLinkFailed", error },
        window.location.origin,
      );
      if (window.opener) window.close();
      else window.location.href = "/app/profile";
    };

    const error = params.get("error");
    const code = params.get("code");
    const state = params.get("state");

    if (error || !code || !state) {
      setMessage(error ?? "Ludoya no devolvió un código de autorización.");
      notify(false, error ?? "missing_code");
      return;
    }

    void completeLudoyaLink({ data: { code, state } })
      .then(() => {
        setMessage("¡Listo! Ya puedes cerrar esta ventana.");
        notify(true);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "No se pudo completar la vinculación";
        setMessage(msg);
        notify(false, msg);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-8">
      <p className="text-center text-ink/70">{message}</p>
    </div>
  );
}
