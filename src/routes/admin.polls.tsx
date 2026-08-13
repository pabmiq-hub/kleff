import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminListPolls, adminSavePoll, adminDeletePoll, adminSetPollStatus } from "@/lib/polls-admin.functions";
import { searchLudoyaBoardgamesFn } from "@/lib/ludoya.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Send, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/polls")({
  component: AdminPollsPage,
});

type AdminData = Awaited<ReturnType<typeof adminListPolls>>;
type AdminPoll = AdminData["polls"][number];

type OptionDraft = {
  id: string | null;
  label: string;
  labelCa: string;
  labelEn: string;
  description: string;
  gameRef: string | null;
  imageUrl: string | null;
  year: number | null;
};

type QuestionType = "text" | "textarea" | "email" | "phone" | "number" | "date" | "single" | "multi" | "select";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Texto corto" },
  { value: "textarea", label: "Texto largo" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  { value: "single", label: "Opción única" },
  { value: "multi", label: "Varias opciones" },
  { value: "select", label: "Desplegable" },
];

const HAS_OPTIONS = (t: QuestionType) => t === "single" || t === "multi" || t === "select";

type QuestionDraft = {
  id: string;
  label: string;
  labelCa: string;
  labelEn: string;
  type: QuestionType;
  help: string;
  required: boolean;
  options: string[];
  optionsCa: string[];
  optionsEn: string[];
};

type Draft = {
  id: string | null;
  kind: "survey" | "acquisition";
  status: "draft" | "published" | "closed";
  titleEs: string;
  titleCa: string;
  titleEn: string;
  descriptionEs: string;
  descriptionCa: string;
  descriptionEn: string;
  opensAt: string;
  closesAt: string;
  karmaCategoryId: string;
  maxChoices: number;
  showResults: boolean;
  questions: QuestionDraft[];
  options: OptionDraft[];
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function emptyDraft(): Draft {
  return {
    id: null,
    kind: "acquisition",
    status: "draft",
    titleEs: "",
    titleCa: "",
    titleEn: "",
    descriptionEs: "",
    descriptionCa: "",
    descriptionEn: "",
    opensAt: new Date().toISOString().slice(0, 16),
    closesAt: "",
    karmaCategoryId: "none",
    maxChoices: 1,
    showResults: true,
    questions: [],
    options: [],
  };
}

function AdminPollsPage() {
  const listFn = useServerFn(adminListPolls);
  const saveFn = useServerFn(adminSavePoll);
  const deleteFn = useServerFn(adminDeletePoll);
  const statusFn = useServerFn(adminSetPollStatus);
  const searchFn = useServerFn(searchLudoyaBoardgamesFn);

  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id?: string; name?: string; imageUrl?: string; year?: number }[]>([]);
  const [searching, setSearching] = useState(false);

  const defaultKarmaFor = useCallback(
    (kind: Draft["kind"]) => {
      const code = kind === "survey" ? "survey" : "poll_vote";
      return (data?.categories ?? []).find((c) => c.code === code)?.id ?? "none";
    },
    [data],
  );

  const reload = useCallback(() => listFn({ data: undefined as never }).then(setData), [listFn]);

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, [reload]);

  const openEdit = (p: AdminPoll) =>
    setDraft({
      id: p.id,
      kind: p.kind as Draft["kind"],
      status: p.status as Draft["status"],
      titleEs: p.titleEs,
      titleCa: p.titleCa ?? "",
      titleEn: p.titleEn ?? "",
      descriptionEs: p.descriptionEs ?? "",
      descriptionCa: p.descriptionCa ?? "",
      descriptionEn: p.descriptionEn ?? "",
      opensAt: toLocalInput(p.opensAt),
      closesAt: toLocalInput(p.closesAt),
      karmaCategoryId: p.karmaCategoryId ?? "none",
      maxChoices: p.maxChoices,
      showResults: p.showResults,
      questions: (p.questions ?? []).map((q) => ({
        id: q.id,
        label: q.label,
        labelCa: q.labelCa ?? "",
        labelEn: q.labelEn ?? "",
        type: q.type as QuestionType,
        help: q.help ?? "",
        required: q.required ?? true,
        options: q.options ?? [],
        optionsCa: q.optionsCa ?? [],
        optionsEn: q.optionsEn ?? [],
      })),
      options: p.options.map((o) => ({
        id: o.id,
        label: o.label,
        labelCa: o.labelCa ?? "",
        labelEn: o.labelEn ?? "",
        description: o.description ?? "",
        gameRef: o.gameRef ?? null,
        imageUrl: o.imageUrl ?? null,
        year: o.year ?? null,
      })),
    });

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const r = await searchFn({ data: { query: query.trim() } });
      setResults((r.results as typeof results) ?? []);
    } catch {
      toast.error("No se pudo buscar en Ludoya");
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    if (draft.titleEs.trim().length < 2) {
      toast.error("Pon un título");
      return;
    }
    if (draft.kind === "acquisition" && draft.options.length < 2) {
      toast.error("Añade al menos dos opciones");
      return;
    }
    if (draft.kind === "survey") {
      if (draft.questions.length === 0) {
        toast.error("Añade al menos una pregunta");
        return;
      }
      if (draft.questions.some((q) => !q.label.trim())) {
        toast.error("Todas las preguntas necesitan un enunciado");
        return;
      }
      if (draft.questions.some((q) => HAS_OPTIONS(q.type) && q.options.filter((o) => o.trim()).length < 2)) {
        toast.error("Las preguntas con opciones necesitan al menos dos respuestas");
        return;
      }
    }
    setBusy(true);
    try {
      const r = await saveFn({
        data: {
          id: draft.id,
          kind: draft.kind,
          status: draft.status,
          titleEs: draft.titleEs,
          titleCa: draft.titleCa || null,
          titleEn: draft.titleEn || null,
          descriptionEs: draft.descriptionEs || null,
          descriptionCa: draft.descriptionCa || null,
          descriptionEn: draft.descriptionEn || null,
          opensAt: draft.opensAt,
          closesAt: draft.closesAt || null,
          karmaCategoryId: draft.karmaCategoryId === "none" ? null : draft.karmaCategoryId,
          maxChoices: draft.maxChoices,
          showResults: draft.showResults,
          questions: draft.questions.map((q) => ({
            id: q.id,
            label: q.label.trim(),
            labelCa: q.labelCa.trim() || null,
            labelEn: q.labelEn.trim() || null,
            type: q.type,
            help: q.help.trim() || null,
            required: q.required,
            options: HAS_OPTIONS(q.type) ? q.options.map((o) => o.trim()).filter(Boolean) : [],
            optionsCa: HAS_OPTIONS(q.type) ? q.optionsCa.map((o) => o.trim()) : [],
            optionsEn: HAS_OPTIONS(q.type) ? q.optionsEn.map((o) => o.trim()) : [],
          })),
          options: draft.options.map((o) => ({
            id: o.id,
            label: o.label,
            labelCa: o.labelCa || null,
            labelEn: o.labelEn || null,
            description: o.description || null,
            gameRef: o.gameRef,
            imageUrl: o.imageUrl,
            year: o.year,
          })),
        },
      });
      toast.success(r.notified ? `Guardado y notificado a ${r.notified} socios` : "Guardado");
      setDraft(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (id: string, status: Draft["status"]) => {
    try {
      const r = await statusFn({ data: { id, status } });
      toast.success(r.notified ? `Publicado y notificado a ${r.notified} socios` : "Estado actualizado");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta votación y todos sus votos?")) return;
    await deleteFn({ data: { id } });
    toast.success("Eliminada");
    await reload();
  };

  if (loading) return <p className="text-ink/70">Cargando…</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Encuestas y votaciones</h1>
          <p className="text-ink/70 mt-1">Crea encuestas generales y votaciones de nuevas adquisiciones.</p>
        </div>
        <Button onClick={() => { const d = emptyDraft(); setDraft({ ...d, karmaCategoryId: defaultKarmaFor(d.kind) }); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva
        </Button>
      </header>

      <div className="space-y-4">
        {(data?.polls ?? []).length === 0 && <p className="text-ink/70">Todavía no has creado ninguna.</p>}
        {(data?.polls ?? []).map((p) => {
          const total = p.options.reduce((s, o) => s + o.votes, 0);
          return (
            <article key={p.id} className="bg-cream-deep border border-ink/10 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-bold">{p.titleEs}</h2>
                    <Badge variant="outline">{p.kind === "survey" ? "Encuesta" : "Adquisiciones"}</Badge>
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>
                      {p.status === "published" ? "Publicada" : p.status === "draft" ? "Borrador" : "Cerrada"}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink/60 mt-1">
                    {p.kind === "survey"
                      ? `${p.responses.length} respuestas`
                      : `${p.voters} votantes · ${total} puntos de voto`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  {p.status !== "published" && (
                    <Button size="sm" onClick={() => void handleStatus(p.id, "published")}>
                      <Send className="h-4 w-4 mr-1" /> Publicar
                    </Button>
                  )}
                  {p.status === "published" && (
                    <Button size="sm" variant="outline" onClick={() => void handleStatus(p.id, "closed")}>
                      Cerrar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => void handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {p.kind === "acquisition" && p.options.length > 0 && (
                <ul className="space-y-1">
                  {[...p.options]
                    .sort((a, b) => b.votes - a.votes)
                    .map((o) => (
                      <li key={o.id} className="flex items-center gap-2 text-sm">
                        <span className="w-40 truncate">{o.label}</span>
                        <div className="h-2 flex-1 rounded-full bg-ink/10 overflow-hidden">
                          <div
                            className="h-full bg-coral"
                            style={{ width: `${total ? Math.round((o.votes / total) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs w-8 text-right">{o.votes}</span>
                      </li>
                    ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar" : "Nueva encuesta o votación"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(v) => {
                      const kind = v as Draft["kind"];
                      setDraft({ ...draft, kind, karmaCategoryId: defaultKarmaFor(kind) });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acquisition">Votación de adquisiciones</SelectItem>
                      <SelectItem value="survey">Encuesta general</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Recompensa de karma</Label>
                  <Select
                    value={draft.karmaCategoryId}
                    onValueChange={(v) => setDraft({ ...draft, karmaCategoryId: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin karma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin karma</SelectItem>
                      {(data?.categories ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name_es} (+{c.points})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Título (ES)</Label>
                <Input value={draft.titleEs} onChange={(e) => setDraft({ ...draft, titleEs: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Títol (CA)</Label>
                  <Input value={draft.titleCa} onChange={(e) => setDraft({ ...draft, titleCa: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Title (EN)</Label>
                  <Input value={draft.titleEn} onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descripción (ES)</Label>
                <Textarea
                  value={draft.descriptionEs}
                  onChange={(e) => setDraft({ ...draft, descriptionEs: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Descripció (CA)</Label>
                  <Textarea
                    value={draft.descriptionCa}
                    onChange={(e) => setDraft({ ...draft, descriptionCa: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={draft.descriptionEn}
                    onChange={(e) => setDraft({ ...draft, descriptionEn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Se abre</Label>
                  <Input
                    type="datetime-local"
                    value={draft.opensAt}
                    onChange={(e) => setDraft({ ...draft, opensAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Se cierra (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={draft.closesAt}
                    onChange={(e) => setDraft({ ...draft, closesAt: e.target.value })}
                  />
                </div>
              </div>

              {draft.kind === "acquisition" ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Opciones que puede elegir cada socio</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={draft.maxChoices}
                        onChange={(e) => setDraft({ ...draft, maxChoices: Number(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={draft.showResults}
                        onCheckedChange={(v) => setDraft({ ...draft, showResults: v })}
                      />
                      <Label className="font-normal">Mostrar resultados a los socios</Label>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-ink/10 p-3">
                    <Label>Añadir juego desde Ludoya / BGG</Label>
                    <div className="flex gap-2">
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar juego…"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleSearch();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => void handleSearch()} disabled={searching}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    {results.length > 0 && (
                      <ul className="max-h-40 overflow-y-auto space-y-1">
                        {results.map((g, i) => (
                          <li key={`${g.id ?? i}`}>
                            <button
                              type="button"
                              className="w-full text-left text-sm px-2 py-1 rounded hover:bg-cream-deep"
                              onClick={() => {
                                setDraft({
                                  ...draft,
                                  options: [
                                    ...draft.options,
                                    {
                                      id: null,
                                      label: g.name ?? "Juego",
                                      description: "",
                                      gameRef: g.id ? String(g.id) : null,
                                      imageUrl: g.imageUrl ?? null,
                                      year: g.year ?? null,
                                    },
                                  ],
                                });
                                setResults([]);
                                setQuery("");
                              }}
                            >
                              {g.name} {g.year ? `(${g.year})` : ""}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          options: [
                            ...draft.options,
                            { id: null, label: "", labelCa: "", labelEn: "", description: "", gameRef: null, imageUrl: null, year: null },
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Opción manual
                    </Button>
                  </div>

                  <ul className="space-y-2">
                    {draft.options.map((o, i) => (
                      <li key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          {o.imageUrl && <img src={o.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />}
                          <Input
                            value={o.label}
                            placeholder="Nombre de la opción (ES)"
                            onChange={(e) => {
                              const options = [...draft.options];
                              options[i] = { ...o, label: e.target.value };
                              setDraft({ ...draft, options });
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraft({ ...draft, options: draft.options.filter((_, x) => x !== i) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2 pl-1">
                          <Input
                            value={o.labelCa}
                            placeholder="Nom (CA)"
                            onChange={(e) => {
                              const options = [...draft.options];
                              options[i] = { ...o, labelCa: e.target.value };
                              setDraft({ ...draft, options });
                            }}
                          />
                          <Input
                            value={o.labelEn}
                            placeholder="Name (EN)"
                            onChange={(e) => {
                              const options = [...draft.options];
                              options[i] = { ...o, labelEn: e.target.value };
                              setDraft({ ...draft, options });
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Preguntas</Label>
                  {draft.questions.map((q, i) => {
                    const update = (patch: Partial<QuestionDraft>) => {
                      const questions = [...draft.questions];
                      questions[i] = { ...q, ...patch };
                      setDraft({ ...draft, questions });
                    };
                    return (
                      <div key={q.id} className="rounded-xl border border-ink/10 p-3 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={q.label}
                            placeholder="Pregunta"
                            onChange={(e) => update({ label: e.target.value })}
                          />
                          <Select
                            value={q.type}
                            onValueChange={(v) => {
                              const type = v as QuestionType;
                              update({
                                type,
                                options: HAS_OPTIONS(type) && q.options.length === 0 ? ["", ""] : q.options,
                              });
                            }}
                          >
                            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, x) => x !== i) })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input
                            value={q.labelCa}
                            placeholder="Pregunta (CA)"
                            onChange={(e) => update({ labelCa: e.target.value })}
                          />
                          <Input
                            value={q.labelEn}
                            placeholder="Question (EN)"
                            onChange={(e) => update({ labelEn: e.target.value })}
                          />
                        </div>

                        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                          <Input
                            value={q.help}
                            placeholder="Texto de ayuda (opcional)"
                            onChange={(e) => update({ help: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <Switch checked={q.required} onCheckedChange={(v) => update({ required: v })} />
                            <Label className="font-normal text-sm">Obligatoria</Label>
                          </div>
                        </div>

                        {HAS_OPTIONS(q.type) && (
                          <div className="space-y-2">
                            <Label className="text-xs text-ink/60">Opciones de respuesta</Label>
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={opt}
                                    placeholder={`Opción ${oi + 1} (ES)`}
                                    onChange={(e) => {
                                      const options = [...q.options];
                                      options[oi] = e.target.value;
                                      update({ options });
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      update({
                                        options: q.options.filter((_, x) => x !== oi),
                                        optionsCa: q.optionsCa.filter((_, x) => x !== oi),
                                        optionsEn: q.optionsEn.filter((_, x) => x !== oi),
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-2 pl-1">
                                  <Input
                                    value={q.optionsCa[oi] ?? ""}
                                    placeholder={`Opció ${oi + 1} (CA)`}
                                    onChange={(e) => {
                                      const optionsCa = [...q.optionsCa];
                                      while (optionsCa.length < q.options.length) optionsCa.push("");
                                      optionsCa[oi] = e.target.value;
                                      update({ optionsCa });
                                    }}
                                  />
                                  <Input
                                    value={q.optionsEn[oi] ?? ""}
                                    placeholder={`Option ${oi + 1} (EN)`}
                                    onChange={(e) => {
                                      const optionsEn = [...q.optionsEn];
                                      while (optionsEn.length < q.options.length) optionsEn.push("");
                                      optionsEn[oi] = e.target.value;
                                      update({ optionsEn });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => update({ options: [...q.options, ""] })}
                            >
                              <Plus className="h-4 w-4 mr-1" /> Añadir opción
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        questions: [
                          ...draft.questions,
                          { id: `q${Date.now()}`, label: "", labelCa: "", labelEn: "", type: "text", help: "", required: true, options: [], optionsCa: [], optionsEn: [] },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Añadir pregunta
                  </Button>

                </div>
              )}

              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicada (notifica a los socios)</SelectItem>
                    <SelectItem value="closed">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button>
            <Button onClick={() => void handleSave()} disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
