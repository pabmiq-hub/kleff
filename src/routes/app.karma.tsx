import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getKarmaCatalog,
  getMyKarma,
  submitKarmaEntry,
  redeemKarmaReward,
  getKarmaRanking,
  setKarmaRankingOptIn,
} from "@/lib/karma.functions";
import { levelForKarma, nextLevelForKarma as nextLevel, KARMA_LEVELS } from "@/lib/karma-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Gift, Trophy, Plus, Loader2, Users, Crown } from "lucide-react";
import { ImagePicker } from "@/components/cms/ImagePicker";
import { useI18n } from "@/i18n/I18nProvider";
import { getMyReferrals, createMyReferral } from "@/lib/karma-referrals.functions";

export const Route = createFileRoute("/app/karma")({
  head: () => ({
    meta: [
      { title: "Karma — Zona socios" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KarmaPage,
});

type Category = {
  id: string;
  code: string;
  grp: string;
  name_es: string;
  name_ca?: string | null;
  name_en?: string | null;
  description_es: string | null;
  description_ca?: string | null;
  description_en?: string | null;
  points: number;
  points_min: number | null;
  points_max: number | null;
  limit_period: string;
  limit_count: number | null;
  member_requestable: boolean;
  requires_evidence: boolean;
};

type Reward = {
  id: string;
  name_es: string;
  name_ca?: string | null;
  name_en?: string | null;
  description_es: string | null;
  description_ca?: string | null;
  description_en?: string | null;
  cost: number;
  effect: string;
  effect_value: number | null;
  stock: number | null;
};

const GROUP_LABELS: Record<string, string> = {
  ludoteca: "Ludoteca y juegos",
  difusion: "Difusión y comunidad",
  referidos: "Referidos",
  participacion: "Participación",
  organizacion: "Organización",
  otras: "Otras",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  voided: "Anulada",
  requested: "Solicitado",
  delivered: "Entregado",
};

function KarmaPage() {
  const loadMine = useServerFn(getMyKarma);
  const loadCatalog = useServerFn(getKarmaCatalog);
  const loadRanking = useServerFn(getKarmaRanking);
  const submitEntry = useServerFn(submitKarmaEntry);
  const redeem = useServerFn(redeemKarmaReward);
  const setOptIn = useServerFn(setKarmaRankingOptIn);

  const [mine, setMine] = useState<Awaited<ReturnType<typeof getMyKarma>> | null>(null);
  const [catalog, setCatalog] = useState<{ categories: Category[]; rewards: Reward[]; season: { name: string; ends_on: string } | null } | null>(null);
  const [ranking, setRanking] = useState<{ userId: string; name: string; avatarUrl: string | null; points: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [entryOpen, setEntryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [rewardOpen, setRewardOpen] = useState<Reward | null>(null);
  const [targetRental, setTargetRental] = useState("");

  const refresh = useCallback(async () => {
    const [m, c, r] = await Promise.all([
      loadMine({ data: undefined as never }),
      loadCatalog({ data: undefined as never }),
      loadRanking({ data: undefined as never }),
    ]);
    setMine(m);
    setCatalog(c as never);
    setRanking(r.ranking);
  }, [loadMine, loadCatalog, loadRanking]);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const level = levelForKarma(mine?.lifetime ?? 0);
  const upcoming = nextLevel(mine?.lifetime ?? 0);
  const progress = useMemo(() => {
    if (!upcoming) return 100;
    const lifetime = mine?.lifetime ?? 0;
    const span = upcoming.min - level.min || 1;
    return Math.min(100, Math.round(((lifetime - level.min) / span) * 100));
  }, [mine?.lifetime, level, upcoming]);

  const grouped = useMemo(() => {
    const map = new Map<string, Category[]>();
    (catalog?.categories ?? []).forEach((c) => {
      const arr = map.get(c.grp) ?? [];
      arr.push(c);
      map.set(c.grp, arr);
    });
    return [...map.entries()];
  }, [catalog]);

  const selectedCategory = (catalog?.categories ?? []).find((c) => c.id === categoryId);

  async function handleSubmitEntry() {
    if (!categoryId) return;
    setSaving(true);
    try {
      await submitEntry({
        data: {
          categoryId,
          description: description || undefined,
          evidenceUrl: evidenceUrl || undefined,
        },
      });
      toast.success("Contribución enviada. El equipo la revisará pronto.");
      setEntryOpen(false);
      setCategoryId("");
      setDescription("");
      setEvidenceUrl("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRedeem() {
    if (!rewardOpen) return;
    setSaving(true);
    try {
      await redeem({
        data: {
          rewardId: rewardOpen.id,
          targetRentalId: rewardOpen.effect === "extend_rental" ? targetRental || null : null,
        },
      });
      toast.success("Canje solicitado. Te avisaremos cuando se confirme.");
      setRewardOpen(null);
      setTargetRental("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo canjear");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-ink/50">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Karma</h1>
          <p className="text-ink/60 mt-1">
            Suma puntos por cuidar la comunidad y cámbialos por ventajas.
            {catalog?.season ? ` Temporada: ${catalog.season.name}.` : ""}
          </p>
        </div>
        <Button onClick={() => setEntryOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Registrar contribución
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">Saldo disponible</p>
          <p className="font-display text-4xl font-bold mt-1">{mine?.balance ?? 0}</p>
          <p className="text-xs text-ink/50 mt-1">puntos de Karma</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">Nivel</p>
          <p className="font-display text-2xl font-bold mt-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-coral" /> {level.name}
          </p>
          <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
            <div className="h-full bg-coral" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-ink/50 mt-2">
            {upcoming
              ? `${upcoming.min - (mine?.lifetime ?? 0)} pts para ${upcoming.name}`
              : "Nivel máximo alcanzado"}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">Karma histórico</p>
          <p className="font-display text-4xl font-bold mt-1">{mine?.lifetime ?? 0}</p>
          <p className="text-xs text-ink/50 mt-1">{level.perk}</p>
        </div>
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Cómo sumar</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
          <TabsTrigger value="historial">Mi historial</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-6 pt-4">
          {grouped.map(([grp, cats]) => (
            <section key={grp}>
              <h2 className="font-display text-lg font-bold mb-2">{GROUP_LABELS[grp] ?? grp}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {cats.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ink/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{c.name_es}</p>
                        {c.description_es ? (
                          <p className="text-sm text-ink/60 mt-1">{c.description_es}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.limit_period !== "none" && c.limit_count ? (
                            <Badge variant="secondary" className="text-[11px]">
                              Máx. {c.limit_count} / {c.limit_period === "weekly" ? "semana" : "mes"}
                            </Badge>
                          ) : null}
                          {c.requires_evidence ? (
                            <Badge variant="secondary" className="text-[11px]">Requiere evidencia</Badge>
                          ) : null}
                          {!c.member_requestable ? (
                            <Badge variant="secondary" className="text-[11px]">Asigna el equipo</Badge>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 font-display font-bold text-coral">
                        {c.points_min && c.points_max
                          ? `${c.points_min}–${c.points_max}`
                          : `+${c.points}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="recompensas" className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog?.rewards ?? []).map((r) => {
              const affordable = (mine?.balance ?? 0) >= r.cost;
              const soldOut = r.stock !== null && r.stock <= 0;
              return (
                <div key={r.id} className="rounded-2xl border border-ink/10 bg-white p-5 flex flex-col">
                  <Gift className="h-5 w-5 text-coral" />
                  <p className="font-semibold mt-2">{r.name_es}</p>
                  {r.description_es ? (
                    <p className="text-sm text-ink/60 mt-1 flex-1">{r.description_es}</p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-display font-bold">{r.cost} pts</span>
                    <Button
                      size="sm"
                      disabled={!affordable || soldOut}
                      onClick={() => {
                        setRewardOpen(r);
                        setTargetRental("");
                      }}
                    >
                      {soldOut ? "Agotado" : affordable ? "Canjear" : "Saldo insuficiente"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="historial" className="space-y-6 pt-4">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">Contribuciones</h2>
            <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
              {(mine?.entries ?? []).length === 0 ? (
                <p className="p-4 text-sm text-ink/50">Todavía no has registrado contribuciones.</p>
              ) : (
                mine!.entries.map((e) => (
                  <div key={e.id} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{e.categoryName}</p>
                      {e.description ? <p className="text-sm text-ink/60">{e.description}</p> : null}
                      <p className="text-xs text-ink/40 mt-1">
                        {new Date(e.created_at).toLocaleDateString("es-ES")}
                        {e.decision_note ? ` · ${e.decision_note}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold">
                        {e.status === "approved" ? `+${e.points}` : `${e.points}`}
                      </p>
                      <Badge variant="secondary" className="text-[11px] mt-1">
                        {STATUS_LABELS[e.status] ?? e.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Canjes</h2>
            <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
              {(mine?.redemptions ?? []).length === 0 ? (
                <p className="p-4 text-sm text-ink/50">Aún no has canjeado recompensas.</p>
              ) : (
                mine!.redemptions.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{r.rewardName}</p>
                      <p className="text-xs text-ink/40">
                        {new Date(r.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold">−{r.points_spent}</p>
                      <Badge variant="secondary" className="text-[11px] mt-1">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4 pt-4">
          <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-4">
            <Switch
              id="optin"
              checked={mine?.rankingOptIn ?? true}
              onCheckedChange={async (v) => {
                await setOptIn({ data: { optIn: v } });
                await refresh();
              }}
            />
            <Label htmlFor="optin" className="text-sm">
              Quiero aparecer en el ranking público de socios
            </Label>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {ranking.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">Aún no hay puntuaciones este mes.</p>
            ) : (
              ranking.map((r, i) => (
                <div key={r.userId} className="p-3 flex items-center gap-3">
                  <span className="w-6 text-center font-display font-bold text-ink/50">{i + 1}</span>
                  {r.avatarUrl ? (
                    <img src={r.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-ink/10" />
                  )}
                  <span className="flex-1 font-medium">{r.name}</span>
                  {i === 0 ? <Trophy className="h-4 w-4 text-coral" /> : null}
                  <span className="font-display font-bold">{r.points}</span>
                </div>
              ))
            )}
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-4">
            <h3 className="font-display font-bold mb-2">Niveles</h3>
            <ul className="text-sm space-y-1 text-ink/70">
              {KARMA_LEVELS.map((l) => (
                <li key={l.key}>
                  <strong>{l.name}</strong> — {l.min}
                  {l.max ? `–${l.max}` : "+"} pts · {l.perk}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Registrar contribución */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar contribución</DialogTitle>
            <DialogDescription>
              El equipo revisará tu solicitud y aprobará los puntos correspondientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog?.categories ?? [])
                    .filter((c) => c.member_requestable)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name_es} (+{c.points})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cuéntanos brevemente qué has hecho"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Evidencia {selectedCategory?.requires_evidence ? "(obligatoria)" : "(opcional)"}
              </Label>
              <Input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Enlace a la publicación, reseña o foto"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEntry} disabled={!categoryId || saving}>
              {saving ? "Enviando…" : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canjear recompensa */}
      <Dialog open={!!rewardOpen} onOpenChange={(o) => !o && setRewardOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Canjear {rewardOpen?.name_es}</DialogTitle>
            <DialogDescription>
              Se descontarán {rewardOpen?.cost} puntos de tu saldo.
            </DialogDescription>
          </DialogHeader>
          {rewardOpen?.effect === "extend_rental" ? (
            <div className="space-y-1.5">
              <Label>Préstamo a ampliar</Label>
              <Select value={targetRental} onValueChange={setTargetRental}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un préstamo activo" />
                </SelectTrigger>
                <SelectContent>
                  {(mine?.activeRentals ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} — vence {new Date(r.dueAt).toLocaleDateString("es-ES")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardOpen(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={saving || (rewardOpen?.effect === "extend_rental" && !targetRental)}
            >
              {saving ? "Canjeando…" : "Confirmar canje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
