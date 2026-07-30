import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListKarmaEntries,
  adminDecideKarmaEntry,
  adminGrantKarma,
  adminVoidKarmaEntry,
  adminListKarmaConfig,
  adminSaveKarmaCategory,
  adminDeleteKarmaCategory,
  adminSaveKarmaReward,
  adminDeleteKarmaReward,
  adminListKarmaRedemptions,
  adminDecideKarmaRedemption,
  adminSaveKarmaSeason,
  adminCloseKarmaSeason,
} from "@/lib/karma-admin.functions";
import { listUsers } from "@/lib/admin.functions";
import {
  KARMA_GROUP_LABELS,
  KARMA_ENTRY_STATUS_LABELS,
  KARMA_REDEMPTION_STATUS_LABELS,
  KARMA_EFFECT_LABELS,
} from "@/lib/karma-levels";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin/karma")({
  head: () => ({
    meta: [
      { title: "Karma — Administración" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminKarmaPage,
});

type Cat = Record<string, never> & {
  id: string;
  code: string;
  grp: string;
  name_es: string;
  name_ca: string;
  name_en: string;
  description_es: string | null;
  points: number;
  points_min: number | null;
  points_max: number | null;
  limit_period: "none" | "weekly" | "monthly";
  limit_count: number | null;
  member_requestable: boolean;
  requires_evidence: boolean;
  is_active: boolean;
  sort_order: number;
};

type Rew = {
  id: string;
  code: string;
  name_es: string;
  name_ca: string;
  name_en: string;
  description_es: string | null;
  cost: number;
  effect: string;
  effect_value: number | null;
  stock: number | null;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_CAT = {
  id: null as string | null,
  code: "",
  grp: "otras" as const,
  nameEs: "",
  nameCa: "",
  nameEn: "",
  descriptionEs: "",
  points: 10,
  pointsMin: null as number | null,
  pointsMax: null as number | null,
  limitPeriod: "none" as "none" | "weekly" | "monthly",
  limitCount: null as number | null,
  memberRequestable: true,
  requiresEvidence: false,
  isActive: true,
  sortOrder: 100,
};

const EMPTY_REW = {
  id: null as string | null,
  code: "",
  nameEs: "",
  nameCa: "",
  nameEn: "",
  descriptionEs: "",
  cost: 50,
  effect: "manual" as string,
  effectValue: null as number | null,
  stock: null as number | null,
  isActive: true,
  sortOrder: 100,
};

function AdminKarmaPage() {
  const listEntries = useServerFn(adminListKarmaEntries);
  const decideEntry = useServerFn(adminDecideKarmaEntry);
  const grantKarma = useServerFn(adminGrantKarma);
  const voidEntry = useServerFn(adminVoidKarmaEntry);
  const listConfig = useServerFn(adminListKarmaConfig);
  const saveCategory = useServerFn(adminSaveKarmaCategory);
  const deleteCategory = useServerFn(adminDeleteKarmaCategory);
  const saveReward = useServerFn(adminSaveKarmaReward);
  const deleteReward = useServerFn(adminDeleteKarmaReward);
  const listRedemptions = useServerFn(adminListKarmaRedemptions);
  const decideRedemption = useServerFn(adminDecideKarmaRedemption);
  const saveSeason = useServerFn(adminSaveKarmaSeason);
  const closeSeason = useServerFn(adminCloseKarmaSeason);
  const loadUsers = useServerFn(listUsers);

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "voided" | "all">("pending");
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof adminListKarmaEntries>>["entries"]>([]);
  const [config, setConfig] = useState<{ categories: Cat[]; rewards: Rew[]; seasons: { id: string; name: string; starts_on: string; ends_on: string; carryover_max: number; is_active: boolean }[] }>({ categories: [], rewards: [], seasons: [] });
  const [redemptions, setRedemptions] = useState<Awaited<ReturnType<typeof adminListKarmaRedemptions>>["redemptions"]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string; member_number: number }[]>([]);

  const [catForm, setCatForm] = useState<typeof EMPTY_CAT | null>(null);
  const [rewForm, setRewForm] = useState<typeof EMPTY_REW | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantUser, setGrantUser] = useState("");
  const [grantPoints, setGrantPoints] = useState(10);
  const [grantDesc, setGrantDesc] = useState("");
  const [seasonForm, setSeasonForm] = useState<{ id: string; name: string; nextName: string; nextStartsOn: string; nextEndsOn: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(
    async (status = statusFilter) => {
      const [e, c, r] = await Promise.all([
        listEntries({ data: { status } }),
        listConfig({ data: undefined as never }),
        listRedemptions({ data: undefined as never }),
      ]);
      setEntries(e.entries);
      setConfig(c as never);
      setRedemptions(r.redemptions);
    },
    [listEntries, listConfig, listRedemptions, statusFilter],
  );

  useEffect(() => {
    void Promise.all([
      refresh(),
      loadUsers({ data: undefined as never }).then((r) =>
        setMembers(r.users.map((u) => ({ id: u.id, full_name: u.full_name, member_number: u.member_number }))),
      ),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setSaving(true);
    try {
      await fn();
      toast.success(ok);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ha ocurrido un error");
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

  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Karma</h1>
          <p className="text-ink/60 mt-1">Valida contribuciones, gestiona recompensas y temporadas.</p>
        </div>
        <Button className="gap-2" onClick={() => setGrantOpen(true)}>
          <Plus className="h-4 w-4" /> Asignar puntos
        </Button>
      </header>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">
            Contribuciones{pendingCount ? ` (${pendingCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="redemptions">Canjes</TabsTrigger>
          <TabsTrigger value="categories">Baremo</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="seasons">Temporadas</TabsTrigger>
        </TabsList>

        {/* ---- Entries ---- */}
        <TabsContent value="entries" className="space-y-3 pt-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as typeof statusFilter);
              void refresh(v as typeof statusFilter);
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
              <SelectItem value="voided">Anuladas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {entries.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">No hay contribuciones en este estado.</p>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      #{e.memberNumber ?? "—"} {e.memberName}
                    </p>
                    <p className="text-sm text-ink/70">{e.categoryName}</p>
                    {e.description ? <p className="text-sm text-ink/60">{e.description}</p> : null}
                    {e.evidence_url ? (
                      <a
                        href={e.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-coral underline break-all"
                      >
                        Ver evidencia
                      </a>
                    ) : null}
                    <p className="text-xs text-ink/40 mt-1">
                      {new Date(e.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{KARMA_ENTRY_STATUS_LABELS[e.status] ?? e.status}</Badge>
                    <span className="font-display font-bold">{e.points} pts</span>
                    {e.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            run(() => decideEntry({ data: { entryId: e.id, approve: true } }), "Contribución aprobada")
                          }
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => {
                            const note = window.prompt("Motivo del rechazo (opcional)") ?? undefined;
                            void run(
                              () => decideEntry({ data: { entryId: e.id, approve: false, note } }),
                              "Contribución rechazada",
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : e.status === "approved" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => {
                          const note = window.prompt("Motivo de la anulación (opcional)") ?? undefined;
                          void run(() => voidEntry({ data: { entryId: e.id, note } }), "Contribución anulada");
                        }}
                      >
                        Anular
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ---- Redemptions ---- */}
        <TabsContent value="redemptions" className="pt-4">
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {redemptions.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">No hay canjes registrados.</p>
            ) : (
              redemptions.map((r) => (
                <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      #{r.memberNumber ?? "—"} {r.memberName}
                    </p>
                    <p className="text-sm text-ink/70">
                      {r.rewardName} · {KARMA_EFFECT_LABELS[r.effect] ?? r.effect}
                    </p>
                    <p className="text-xs text-ink/40">{new Date(r.created_at).toLocaleString("es-ES")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {KARMA_REDEMPTION_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                    <span className="font-display font-bold">−{r.points_spent}</span>
                    {r.status === "requested" ? (
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={() =>
                          run(
                            () => decideRedemption({ data: { redemptionId: r.id, action: "approve" } }),
                            "Canje aprobado",
                          )
                        }
                      >
                        Aprobar
                      </Button>
                    ) : null}
                    {r.status === "approved" ? (
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={() =>
                          run(
                            () => decideRedemption({ data: { redemptionId: r.id, action: "deliver" } }),
                            "Recompensa entregada",
                          )
                        }
                      >
                        Marcar entregado
                      </Button>
                    ) : null}
                    {r.status !== "rejected" && r.status !== "delivered" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => {
                          const note = window.prompt("Motivo del rechazo (opcional)") ?? undefined;
                          void run(
                            () => decideRedemption({ data: { redemptionId: r.id, action: "reject", note } }),
                            "Canje rechazado",
                          );
                        }}
                      >
                        Rechazar
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ---- Categories ---- */}
        <TabsContent value="categories" className="space-y-3 pt-4">
          <Button variant="outline" className="gap-2" onClick={() => setCatForm({ ...EMPTY_CAT })}>
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {config.categories.map((c) => (
              <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {c.name_es} {!c.is_active ? <Badge variant="secondary">Inactiva</Badge> : null}
                  </p>
                  <p className="text-xs text-ink/50">
                    {KARMA_GROUP_LABELS[c.grp] ?? c.grp} · {c.points} pts
                    {c.limit_period !== "none" && c.limit_count
                      ? ` · máx. ${c.limit_count}/${c.limit_period === "weekly" ? "semana" : "mes"}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setCatForm({
                        id: c.id,
                        code: c.code,
                        grp: c.grp as typeof EMPTY_CAT.grp,
                        nameEs: c.name_es,
                        nameCa: c.name_ca,
                        nameEn: c.name_en,
                        descriptionEs: c.description_es ?? "",
                        points: c.points,
                        pointsMin: c.points_min,
                        pointsMax: c.points_max,
                        limitPeriod: c.limit_period,
                        limitCount: c.limit_count,
                        memberRequestable: c.member_requestable,
                        requiresEvidence: c.requires_evidence,
                        isActive: c.is_active,
                        sortOrder: c.sort_order,
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${c.name_es}"?`))
                        void run(() => deleteCategory({ data: { id: c.id } }), "Categoría eliminada");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---- Rewards ---- */}
        <TabsContent value="rewards" className="space-y-3 pt-4">
          <Button variant="outline" className="gap-2" onClick={() => setRewForm({ ...EMPTY_REW })}>
            <Plus className="h-4 w-4" /> Nueva recompensa
          </Button>
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {config.rewards.map((r) => (
              <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.name_es} {!r.is_active ? <Badge variant="secondary">Inactiva</Badge> : null}
                  </p>
                  <p className="text-xs text-ink/50">
                    {r.cost} pts · {KARMA_EFFECT_LABELS[r.effect] ?? r.effect}
                    {r.stock !== null ? ` · stock ${r.stock}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setRewForm({
                        id: r.id,
                        code: r.code,
                        nameEs: r.name_es,
                        nameCa: r.name_ca,
                        nameEn: r.name_en,
                        descriptionEs: r.description_es ?? "",
                        cost: r.cost,
                        effect: r.effect,
                        effectValue: r.effect_value,
                        stock: r.stock,
                        isActive: r.is_active,
                        sortOrder: r.sort_order,
                      })
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${r.name_es}"?`))
                        void run(() => deleteReward({ data: { id: r.id } }), "Recompensa eliminada");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ---- Seasons ---- */}
        <TabsContent value="seasons" className="space-y-3 pt-4">
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {config.seasons.map((s) => (
              <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {s.name} {s.is_active ? <Badge className="ml-1">Activa</Badge> : null}
                  </p>
                  <p className="text-xs text-ink/50">
                    {s.starts_on} → {s.ends_on} · remanente máx. {s.carryover_max} pts
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void run(
                        () =>
                          saveSeason({
                            data: {
                              id: s.id,
                              name: s.name,
                              startsOn: s.starts_on,
                              endsOn: s.ends_on,
                              carryoverMax: s.carryover_max,
                              isActive: true,
                            },
                          }),
                        "Temporada activada",
                      )
                    }
                    disabled={s.is_active}
                  >
                    Activar
                  </Button>
                  {s.is_active ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        setSeasonForm({
                          id: s.id,
                          name: s.name,
                          nextName: "",
                          nextStartsOn: "",
                          nextEndsOn: "",
                        })
                      }
                    >
                      Cerrar temporada
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category dialog */}
      <Dialog open={!!catForm} onOpenChange={(o) => !o && setCatForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{catForm?.id ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          {catForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Grupo</Label>
                  <Select
                    value={catForm.grp}
                    onValueChange={(v) => setCatForm({ ...catForm, grp: v as typeof EMPTY_CAT.grp })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KARMA_GROUP_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre (ES)</Label>
                <Input value={catForm.nameEs} onChange={(e) => setCatForm({ ...catForm, nameEs: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre (CA)</Label>
                  <Input value={catForm.nameCa} onChange={(e) => setCatForm({ ...catForm, nameCa: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre (EN)</Label>
                  <Input value={catForm.nameEn} onChange={(e) => setCatForm({ ...catForm, nameEn: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={catForm.descriptionEs}
                  onChange={(e) => setCatForm({ ...catForm, descriptionEs: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Puntos</Label>
                  <Input
                    type="number"
                    value={catForm.points}
                    onChange={(e) => setCatForm({ ...catForm, points: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mín. (opcional)</Label>
                  <Input
                    type="number"
                    value={catForm.pointsMin ?? ""}
                    onChange={(e) =>
                      setCatForm({ ...catForm, pointsMin: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. (opcional)</Label>
                  <Input
                    type="number"
                    value={catForm.pointsMax ?? ""}
                    onChange={(e) =>
                      setCatForm({ ...catForm, pointsMax: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Límite</Label>
                  <Select
                    value={catForm.limitPeriod}
                    onValueChange={(v) => setCatForm({ ...catForm, limitPeriod: v as typeof catForm.limitPeriod })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin límite</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Máx. por periodo</Label>
                  <Input
                    type="number"
                    disabled={catForm.limitPeriod === "none"}
                    value={catForm.limitCount ?? ""}
                    onChange={(e) =>
                      setCatForm({ ...catForm, limitCount: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={catForm.memberRequestable}
                    onCheckedChange={(v) => setCatForm({ ...catForm, memberRequestable: v })}
                  />
                  El socio puede solicitarla
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={catForm.requiresEvidence}
                    onCheckedChange={(v) => setCatForm({ ...catForm, requiresEvidence: v })}
                  />
                  Requiere evidencia
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={catForm.isActive}
                    onCheckedChange={(v) => setCatForm({ ...catForm, isActive: v })}
                  />
                  Activa
                </label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={saving}
              onClick={() =>
                catForm &&
                run(async () => {
                  await saveCategory({ data: catForm });
                  setCatForm(null);
                }, "Categoría guardada")
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward dialog */}
      <Dialog open={!!rewForm} onOpenChange={(o) => !o && setRewForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{rewForm?.id ? "Editar recompensa" : "Nueva recompensa"}</DialogTitle>
          </DialogHeader>
          {rewForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input value={rewForm.code} onChange={(e) => setRewForm({ ...rewForm, code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Coste (pts)</Label>
                  <Input
                    type="number"
                    value={rewForm.cost}
                    onChange={(e) => setRewForm({ ...rewForm, cost: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre (ES)</Label>
                <Input value={rewForm.nameEs} onChange={(e) => setRewForm({ ...rewForm, nameEs: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre (CA)</Label>
                  <Input value={rewForm.nameCa} onChange={(e) => setRewForm({ ...rewForm, nameCa: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre (EN)</Label>
                  <Input value={rewForm.nameEn} onChange={(e) => setRewForm({ ...rewForm, nameEn: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  rows={2}
                  value={rewForm.descriptionEs}
                  onChange={(e) => setRewForm({ ...rewForm, descriptionEs: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Efecto</Label>
                  <Select value={rewForm.effect} onValueChange={(v) => setRewForm({ ...rewForm, effect: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(KARMA_EFFECT_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    value={rewForm.effectValue ?? ""}
                    onChange={(e) =>
                      setRewForm({ ...rewForm, effectValue: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={rewForm.stock ?? ""}
                    onChange={(e) => setRewForm({ ...rewForm, stock: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={rewForm.isActive} onCheckedChange={(v) => setRewForm({ ...rewForm, isActive: v })} />
                Activa
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={saving}
              onClick={() =>
                rewForm &&
                run(async () => {
                  await saveReward({ data: rewForm as never });
                  setRewForm(null);
                }, "Recompensa guardada")
              }
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar puntos de Karma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Socio</Label>
              <Select value={grantUser} onValueChange={setGrantUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un socio" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      #{m.member_number} {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Puntos (usa negativos para restar)</Label>
              <Input type="number" value={grantPoints} onChange={(e) => setGrantPoints(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea rows={2} value={grantDesc} onChange={(e) => setGrantDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!grantUser || saving}
              onClick={() =>
                run(async () => {
                  await grantKarma({
                    data: { userId: grantUser, points: grantPoints, description: grantDesc || undefined },
                  });
                  setGrantOpen(false);
                  setGrantUser("");
                  setGrantDesc("");
                }, "Puntos asignados")
              }
            >
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close season dialog */}
      <Dialog open={!!seasonForm} onOpenChange={(o) => !o && setSeasonForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar {seasonForm?.name}</DialogTitle>
          </DialogHeader>
          {seasonForm ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre de la nueva temporada</Label>
                <Input
                  value={seasonForm.nextName}
                  onChange={(e) => setSeasonForm({ ...seasonForm, nextName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Inicio</Label>
                  <Input
                    type="date"
                    value={seasonForm.nextStartsOn}
                    onChange={(e) => setSeasonForm({ ...seasonForm, nextStartsOn: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fin</Label>
                  <Input
                    type="date"
                    value={seasonForm.nextEndsOn}
                    onChange={(e) => setSeasonForm({ ...seasonForm, nextEndsOn: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-ink/50">
                Al cerrar, cada socio conserva como máximo el remanente configurado y recibe una notificación.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeasonForm(null)}>
              Cancelar
            </Button>
            <Button
              disabled={saving || !seasonForm?.nextName || !seasonForm?.nextStartsOn || !seasonForm?.nextEndsOn}
              onClick={() =>
                seasonForm &&
                run(async () => {
                  await closeSeason({
                    data: {
                      seasonId: seasonForm.id,
                      nextName: seasonForm.nextName,
                      nextStartsOn: seasonForm.nextStartsOn,
                      nextEndsOn: seasonForm.nextEndsOn,
                    },
                  });
                  setSeasonForm(null);
                }, "Temporada cerrada")
              }
            >
              Cerrar temporada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
