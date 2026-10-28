import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicContest, submitContestVotes } from "@/lib/contests.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/concurso/$slug")({
  head: () => ({
    meta: [
      { title: "Concurso de disfraces · KLEFF" },
      { name: "description", content: "Vota a tus disfraces favoritos del concurso de KLEFF y entra en el sorteo." },
      { property: "og:title", content: "Concurso de disfraces · KLEFF" },
      { property: "og:description", content: "Vota a tus disfraces favoritos y entra en el sorteo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContestVotePage,
});

type Data = Awaited<ReturnType<typeof getPublicContest>>;

function ContestVotePage() {
  const { slug } = Route.useParams();
  const fetchContest = useServerFn(getPublicContest);
  const submit = useServerFn(submitContestVotes);
  const key = `kleff-contest-${slug}`;
  const [data, setData] = useState<Data | undefined>(undefined);
  const [nickname, setNickname] = useState("");
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(key);
    fetchContest({ data: { slug, token } }).then((r) => {
      setData(r);
      if (r?.mine) { setNickname(r.mine.nickname); setVotes(r.mine.votes); setSaved(true); }
    }).catch(() => setData(null));
  }, [fetchContest, slug, key]);

  if (data === undefined) return <main className="p-8 text-center text-muted-foreground">Cargando…</main>;
  if (data === null) return <main className="p-8 text-center"><h1 className="font-display text-2xl">Este concurso no existe</h1></main>;

  const save = async () => {
    setSaving(true);
    try {
      const { token } = await submit({ data: { slug, nickname, votes, token: localStorage.getItem(key) } });
      localStorage.setItem(key, token);
      setSaved(true);
      toast.success("¡Votos guardados! Ya participas en el sorteo.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-32">
      <header className="text-center">
        <h1 className="font-display text-3xl">{data.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {data.open ? "Toca una categoría debajo de la foto para votar a ese participante. Un voto por categoría; guarda tus votos para entrar en el sorteo." : "La votación está cerrada."}
        </p>
        {saved && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"><Check className="h-4 w-4" />Tus votos están guardados{data.open ? " · puedes cambiarlos" : ""}</p>}
      </header>

      {(() => {
        const active = data.categories.filter((c) => data.entries.some((e) => e.categoryIds.includes(c.id)));
        const done = active.filter((c) => votes[c.id]).length;
        if (!active.length) return null;
        return (
          <p className="text-center text-sm text-muted-foreground">
            Has votado en {done} de {active.length} {active.length === 1 ? "categoría" : "categorías"}.
          </p>
        );
      })()}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.entries.map((e) => {
          const anyOn = e.categoryIds.some((cid) => votes[cid] === e.id);
          return (
            <div key={e.id} className={`overflow-hidden rounded-lg border-2 bg-card ${anyOn ? "border-primary" : "border-transparent"}`}>
              <img src={e.photo_url} alt={e.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="space-y-1.5 p-2">
                <div className="text-sm font-medium">{e.name}</div>
                <div className="flex flex-wrap gap-1">
                  {e.categoryIds.map((cid) => {
                    const cat = data.categories.find((c) => c.id === cid);
                    if (!cat) return null;
                    const on = votes[cid] === e.id;
                    return (
                      <button key={cid} type="button" disabled={!data.open} aria-pressed={on}
                        onClick={() => { setVotes({ ...votes, [cid]: e.id }); setSaved(false); }}
                        className={`rounded-full border px-2 py-0.5 text-xs transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.open && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Input value={nickname} onChange={(e) => { setNickname(e.target.value); setSaved(false); }} placeholder="Tu nombre o apodo" maxLength={60} />
            <Button onClick={save} disabled={saving || !nickname.trim() || !Object.keys(votes).length}>{saving ? "Guardando…" : "Guardar votos"}</Button>
          </div>
        </div>
      )}
    </main>
  );
}
