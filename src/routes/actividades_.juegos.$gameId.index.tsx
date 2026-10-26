import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MMAdminGate } from "@/components/mm/AdminGate";
import { MMAvatar } from "@/components/mm/shared";
import { MM_LANGS } from "@/lib/mm/i18n";
import { DIFFICULTY_LABEL } from "@/lib/mm/game-meta";
import { mmControlSession, mmCreateSession, mmGenerateEvidenceArt, mmGenerateItemArt, mmGetGame, mmUpdateCharacterAvatar, mmUpdateGame } from "@/lib/mm/admin.functions";

export const Route = createFileRoute("/actividades_/juegos/$gameId/")({
  head: () => ({
    meta: [
      { title: "Ficha del juego — KLEFF Juegos" },
      { name: "description", content: "Personajes, actos, evidencias e histórico de partidas del juego." },
      { property: "og:title", content: "Ficha del juego — KLEFF" },
      { property: "og:description", content: "Gestiona un juego de misterio y sus partidas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <MMAdminGate back={{ to: "/actividades/juegos", label: "Juegos" }}>
      <GameDetail />
    </MMAdminGate>
  ),
});

const STATUS: Record<string, string> = { lobby: "Sala de espera", running: "En juego", paused: "Pausada", finished: "Finalizada" };

function GameDetail() {
  const { gameId } = Route.useParams();
  const get = useServerFn(mmGetGame);
  const update = useServerFn(mmUpdateGame);
  const navigate = useNavigate();
  const [d, setD] = useState<any>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const load = () => get({ data: { gameId } }).then(setD).catch((e) => toast.error(e.message));
  const genItems = useServerFn(mmGenerateItemArt);
  const genEvidences = useServerFn(mmGenerateEvidenceArt);
  const [artBusy, setArtBusy] = useState(false);
  const genArt = async () => {
    setArtBusy(true);
    try {
      const it = await genItems({ data: { gameId } });
      const ev = await genEvidences({ data: { gameId } });
      const ok = it.generated + ev.generated;
      const ko = it.failed + ev.failed;
      if (ok === 0 && ko === 0) toast.success("Todos los objetos y evidencias ya tenían ilustración.");
      else if (ko) toast.warning(`${ok} ilustraciones creadas; ${ko} han fallado. Vuelve a pulsar para reintentarlas.`);
      else toast.success(`${ok} ilustraciones creadas (${it.generated} objetos, ${ev.generated} evidencias).`);
      void load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setArtBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [gameId]);
  if (!d) return <p className="text-ink/60">Cargando…</p>;
  const g = d.game;
  const actName = (id: string | null) => d.acts.find((a: any) => a.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto min-w-0">
          <h1 className="font-display text-3xl font-bold">{g.title}</h1>
          <p className="text-sm text-ink/60">
            {g.min_players}–{g.max_players} jugadores · {g.duration_minutes} min · {g.status === "published" ? "Publicado" : "Borrador"}
          </p>
        </div>
        <Button variant="outline" disabled={artBusy} onClick={genArt}>
          <Sparkles className="mr-2 h-4 w-4" /> {artBusy ? "Generando ilustraciones…" : "Generar ilustraciones"}
        </Button>
        <Button variant="outline" onClick={async () => { await update({ data: { gameId, status: g.status === "published" ? "draft" : "published" } }); void load(); }}>
          {g.status === "published" ? "Pasar a borrador" : "Publicar"}
        </Button>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva partida
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="info">Juego</TabsTrigger>
          <TabsTrigger value="sessions">Histórico de partidas ({d.sessions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-6 pt-4">
          {g.synopsis && <p className="max-w-3xl text-ink/80">{g.synopsis}</p>}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Personajes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {d.characters.map((c: any) => (
                <div key={c.id} className="flex gap-3 rounded-xl border border-ink/10 bg-card p-3">
                  <MMAvatar name={c.name} config={c.avatar_config} url={c.avatar_url} size={64} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {c.name} {c.is_killer && <span className="ml-1 rounded bg-destructive/15 px-1.5 text-xs text-destructive">Asesino</span>}
                      {c.victim && <span className="ml-1 rounded bg-ink/10 px-1.5 text-xs">Víctima</span>}
                    </p>
                    <p className="line-clamp-2 text-sm text-ink/70">{c.description}</p>
                    <button className="mt-1 text-xs underline" onClick={() => setEditing(c)}>
                      Editar avatar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Actos</h2>
            <ol className="space-y-2">
              {d.acts.map((a: any) => (
                <li key={a.id} className="rounded-xl border border-ink/10 bg-card p-3">
                  <p className="font-semibold">
                    {a.position}. {a.name} <span className="text-xs font-normal text-ink/60">· {a.duration_minutes} min · {a.key}</span>
                  </p>
                  {a.narrative_text && <p className="text-sm text-ink/70">{a.narrative_text}</p>}
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Evidencias</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {d.evidences.map((e: any) => (
                <div key={e.id} className="rounded-xl border border-ink/10 bg-card p-3 text-sm">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-ink/70">{e.content}</p>
                  <p className="mt-1 text-xs text-ink/50">
                    {actName(e.act_id)} · {e.scope === "personal" ? `Personal (${d.characters.find((c: any) => c.id === e.target_character_id)?.name ?? "?"})` : "Común"} · desbloqueo: {e.unlock_rule?.type ?? "auto"}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Acciones conjuntas</h2>
            <ul className="space-y-1 text-sm">
              {d.joint_actions.map((j: any) => (
                <li key={j.id}>
                  <strong>{j.name}</strong> — <span className="text-ink/70">{j.description}</span>
                </li>
              ))}
            </ul>
          </section>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm("¿Borrar el juego y todas sus partidas? No se puede deshacer.")) return;
              await update({ data: { gameId, delete: true } });
              void navigate({ to: "/actividades/juegos" });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Borrar juego
          </Button>
        </TabsContent>
        <TabsContent value="sessions" className="pt-4">
          {d.sessions.length === 0 ? (
            <p className="text-ink/60">Aún no hay partidas.</p>
          ) : (
            <ul className="space-y-2">
              {d.sessions.map((s: any) => (
                <li key={s.id}>
                  <Link to="/actividades/juegos/$gameId/partidas/$sessionId" params={{ gameId, sessionId: s.id }} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-card p-3 hover:shadow">
                    <span className="mr-auto font-semibold">{s.name}</span>
                    <span className="text-xs text-ink/60">{new Date(s.scheduled_at ?? s.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs">{STATUS[s.status]}</span>
                    {s.archived && <span className="text-xs text-ink/50">Archivada</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <NewSessionDialog open={newOpen} onOpenChange={setNewOpen} gameId={gameId} />
      {editing && <AvatarEditor character={editing} onClose={() => { setEditing(null); void load(); }} />}
    </div>
  );
}

function NewSessionDialog({ open, onOpenChange, gameId }: { open: boolean; onOpenChange: (o: boolean) => void; gameId: string }) {
  const create = useServerFn(mmCreateSession);
  const control = useServerFn(mmControlSession);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState<"manual" | "timer" | "auto">("manual");
  const [blind, setBlind] = useState(false);
  const [lang, setLang] = useState("es");
  const [early, setEarly] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva partida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nombre (ej. Viernes 18 oct)" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block text-sm">
            Fecha y hora (opcional)
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["manual", "timer", "auto"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-lg border p-2 text-sm ${mode === m ? "border-primary bg-primary/10" : "border-ink/15"}`}>
                {m === "manual" ? "Manual" : m === "timer" ? "Temporizador" : "Automático"}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} /> Modo ciego (no ver quién es el asesino hasta el final)
          </label>
          <label className="block text-sm">
            Idioma de la partida
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 bg-background p-2">
              {MM_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={early} disabled={!when} onChange={(e) => setEarly(e.target.checked)} /> Repartir personajes automáticamente 24 h antes (requiere fecha)
          </label>
          <Button
            className="w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const at = when ? new Date(when) : null;
              const r = await create({ data: { gameId, name, scheduled_at: at ? at.toISOString() : null, control_mode: mode, blind_mode: blind, language: "es", release_at: at && early ? new Date(at.getTime() - 24 * 3600 * 1000).toISOString() : null } });
              if (lang !== "es") {
                toast.info("Traduciendo el juego… puede tardar un minuto");
                try {
                  await control({ data: { sessionId: r.sessionId, action: "set_language", language: lang as any } });
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }
              setBusy(false);
              void navigate({ to: "/actividades/juegos/$gameId/partidas/$sessionId", params: { gameId, sessionId: r.sessionId } });
            }}
          >
            {busy ? "Creando…" : "Crear partida"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AVATAR_OPTIONS: Record<string, { label: string; values: string[] }> = {
  top: { label: "Peinado", values: ["shortFlat", "shortWaved", "shortCurly", "theCaesar", "sides", "bob", "bun", "curly", "longButNotTooLong", "straight01", "bigHair", "fro", "dreads", "hat", "hijab", "turban", "winterHat1"] },
  hairColor: { label: "Color de pelo", values: ["2c1b18", "4a312c", "724133", "a55728", "b58143", "d6b370", "ecdcbf", "c93305", "e8e1e1", "f59797"] },
  accessories: { label: "Gafas", values: ["", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "kurt", "eyepatch"] },
  clothing: { label: "Ropa", values: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"] },
  facialHair: { label: "Barba", values: ["", "beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"] },
  mouth: { label: "Expresión", values: ["default", "smile", "serious", "twinkle", "concerned", "disbelief", "sad", "grimace", "screamOpen"] },
  skinColor: { label: "Piel", values: ["ffdbb4", "edb98a", "fd9841", "d08b5b", "ae5d29", "614335"] },
};

function AvatarEditor({ character, onClose }: { character: any; onClose: () => void }) {
  const save = useServerFn(mmUpdateCharacterAvatar);
  const [cfg, setCfg] = useState<Record<string, any>>(character.avatar_config ?? {});
  const [url, setUrl] = useState<string>(character.avatar_url ?? "");
  const pick = (k: string) => (Array.isArray(cfg[k]) ? cfg[k][0] : cfg[k]) ?? "";
  const set = (k: string, v: string) => {
    const next = { ...cfg };
    if (!v) {
      delete next[k];
      if (k === "accessories") next.accessoriesProbability = 0;
      if (k === "facialHair") next.facialHairProbability = 0;
    } else {
      next[k] = [v];
      if (k === "accessories") next.accessoriesProbability = 100;
      if (k === "facialHair") next.facialHairProbability = 100;
    }
    setCfg(next);
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avatar de {character.name}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <MMAvatar name={character.name} config={cfg} url={url || null} size={140} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(AVATAR_OPTIONS).map(([k, o]) => (
            <label key={k} className="text-sm">
              {o.label}
              <select value={pick(k)} onChange={(e) => set(k, e.target.value)} className="mt-1 w-full rounded-md border border-ink/20 bg-background p-2">
                {o.values.map((v) => (
                  <option key={v} value={v}>
                    {v || "Ninguno"}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="text-sm">
          O usa una imagen propia (URL)
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
        <Button
          onClick={async () => {
            await save({ data: { characterId: character.id, avatar_config: cfg, avatar_url: url || null } });
            toast.success("Avatar guardado");
            onClose();
          }}
        >
          Guardar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
