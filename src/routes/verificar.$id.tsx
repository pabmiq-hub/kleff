import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyMember } from "@/lib/profile.functions";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/verificar/$id")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verificación de socio · KLEFF" },
      { name: "description", content: "Comprobación pública de un carnet de socio de KLEFF." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface Member {
  memberNumber: number;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  memberSince: string;
}

function VerifyPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(verifyMember);
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; member: Member } | { status: "invalid" } | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    void fn({ data: { id } })
      .then((r) => {
        if (r.valid) setState({ status: "ok", member: r.member as Member });
        else setState({ status: "invalid" });
      })
      .catch(() => setState({ status: "error" }));
  }, [fn, id]);

  return (
    <SiteLayout>
      <div className="max-w-lg mx-auto px-4 py-12">
        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
            <Loader2 className="h-5 w-5 animate-spin" /> Verificando…
          </div>
        )}

        {state.status === "ok" && (
          <div className="bg-card border-2 border-ink rounded-3xl p-8 shadow-tactile space-y-6">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <p className="font-display text-2xl font-bold">Socio verificado</p>
                <p className="text-sm text-muted-foreground">Esta persona consta como socia de KLEFF.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t-2 border-ink/10 pt-6">
              {state.member.avatarUrl ? (
                <img
                  src={state.member.avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover border-2 border-ink"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-coral/20 border-2 border-ink flex items-center justify-center font-display text-3xl font-bold">
                  {state.member.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-display text-xl font-bold leading-tight">{state.member.fullName}</p>
                <p className="text-sm text-muted-foreground">@{state.member.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="uppercase tracking-wider text-xs text-muted-foreground">Nº socio</p>
                <p className="font-mono text-lg font-bold">
                  K-{String(state.member.memberNumber).padStart(4, "0")}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-xs text-muted-foreground">Socio desde</p>
                <p className="font-semibold">
                  {new Date(state.member.memberSince).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        )}

        {state.status === "invalid" && (
          <div className="bg-card border-2 border-ink rounded-3xl p-8 shadow-tactile flex items-center gap-3 text-red-700">
            <XCircle className="h-8 w-8" />
            <div>
              <p className="font-display text-2xl font-bold">Carnet no válido</p>
              <p className="text-sm text-muted-foreground">
                Este código no corresponde a ninguna persona socia de KLEFF.
              </p>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <p className="text-center text-muted-foreground">
            No se ha podido verificar el carnet. Inténtalo de nuevo más tarde.
          </p>
        )}
      </div>
    </SiteLayout>
  );
}
