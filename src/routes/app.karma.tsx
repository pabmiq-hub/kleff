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
import { useAppLocale, pickLocalized } from "@/i18n/app-i18n";
import { commonDict } from "@/i18n/app/common";
import { karmaDict } from "@/i18n/app/karma";
import { getMyReferrals, createMyReferral } from "@/lib/karma-referrals.functions";
import { getOptimizedImageUrl } from "@/lib/image-delivery";

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

function KarmaPage() {
  const { locale } = useAppLocale();
  const c = commonDict[locale];
  const k = karmaDict[locale];
  const loc = <T extends Record<string, unknown>>(row: T, field: "name" | "description"): string => {
    return pickLocalized(locale, {
      es: row[`${field}_es` as keyof T] as string | null,
      ca: row[`${field}_ca` as keyof T] as string | null,
      en: row[`${field}_en` as keyof T] as string | null,
    });
  };

  const loadMine = useServerFn(getMyKarma);
  const loadCatalog = useServerFn(getKarmaCatalog);
  const loadRanking = useServerFn(getKarmaRanking);
  const submitEntry = useServerFn(submitKarmaEntry);
  const redeem = useServerFn(redeemKarmaReward);
  const setOptIn = useServerFn(setKarmaRankingOptIn);
  const loadReferrals = useServerFn(getMyReferrals);
  const addReferral = useServerFn(createMyReferral);

  const [mine, setMine] = useState<Awaited<ReturnType<typeof getMyKarma>> | null>(null);
  const [catalog, setCatalog] = useState<{ categories: Category[]; rewards: Reward[]; season: { name: string; ends_on: string } | null } | null>(null);
  const [ranking, setRanking] = useState<{ userId: string; name: string; avatarUrl: string | null; points: number }[]>([]);
  const [referrals, setReferrals] = useState<
    { id: string; referred_name: string; signup_awarded: boolean; loyalty_awarded: boolean; note: string | null; created_at: string }[]
  >([]);
  const [referredName, setReferredName] = useState("");
  const [referralNote, setReferralNote] = useState("");
  const [loading, setLoading] = useState(true);

  const [entryOpen, setEntryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [rewardOpen, setRewardOpen] = useState<Reward | null>(null);
  const [targetRental, setTargetRental] = useState("");

  const refresh = useCallback(async () => {
    const [m, c, r, ref] = await Promise.all([
      loadMine({ data: undefined as never }),
      loadCatalog({ data: undefined as never }),
      loadRanking({ data: undefined as never }),
      loadReferrals({ data: undefined as never }),
    ]);
    setMine(m);
    setCatalog(c as never);
    setRanking(r.ranking);
    setReferrals(ref.referrals);
  }, [loadMine, loadCatalog, loadRanking, loadReferrals]);

  async function handleAddReferral() {
    if (referredName.trim().length < 2) return;
    setSaving(true);
    try {
      await addReferral({ data: { referredName: referredName.trim(), note: referralNote || undefined } });
      toast.success(k.toastReferralSuccess);
      setReferredName("");
      setReferralNote("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : k.toastReferralError);
    } finally {
      setSaving(false);
    }
  }


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
      toast.success(k.toastEntrySuccess);
      setEntryOpen(false);
      setCategoryId("");
      setDescription("");
      setEvidenceUrl("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : k.toastEntryError);
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
      toast.success(k.toastRedeemSuccess);
      setRewardOpen(null);
      setTargetRental("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : k.toastRedeemError);
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
          <h1 className="font-display text-4xl font-bold">{k.pageTitle}</h1>
          <p className="text-ink/60 mt-1">
            {k.intro}
            {mine?.cycle
              ? k.cycleInfo(mine.cycle.index, new Date(mine.cycle.endsAt).toLocaleDateString(k.dateLocale), mine.cycle.carryoverMax)
              : ""}
          </p>

        </div>
        <Button onClick={() => setEntryOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {k.registerContribution}
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">{k.availableBalance}</p>
          <p className="font-display text-4xl font-bold mt-1">{mine?.balance ?? 0}</p>
          <p className="text-xs text-ink/50 mt-1">{k.karmaPoints}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">{k.level}</p>
          <p className="font-display text-2xl font-bold mt-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-coral" /> {pickLocalized(locale, { es: level.name, ca: level.name_ca, en: level.name_en })}
          </p>
          <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
            <div className="h-full bg-coral" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-ink/50 mt-2">
            {upcoming
              ? k.ptsFor(upcoming.min - (mine?.lifetime ?? 0), pickLocalized(locale, { es: upcoming.name, ca: upcoming.name_ca, en: upcoming.name_en }))
              : k.maxLevelReached}
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-ink/50">{k.lifetimeKarma}</p>
          <p className="font-display text-4xl font-bold mt-1">{mine?.lifetime ?? 0}</p>
          <p className="text-xs text-ink/50 mt-1">{pickLocalized(locale, { es: level.perk, ca: level.perk_ca, en: level.perk_en })}</p>
        </div>
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">{k.tabs.catalog}</TabsTrigger>
          <TabsTrigger value="recompensas">{k.tabs.rewards}</TabsTrigger>
          <TabsTrigger value="referidos">{k.tabs.referrals}</TabsTrigger>
          <TabsTrigger value="historial">{k.tabs.history}</TabsTrigger>
          <TabsTrigger value="ranking">{k.tabs.ranking}</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-6 pt-4">
          {grouped.map(([grp, cats]) => (
            <section key={grp}>
              <h2 className="font-display text-lg font-bold mb-2">{k.groupLabels[grp] ?? grp}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {cats.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ink/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{loc(c, "name")}</p>
                        {loc(c, "description") ? (
                          <p className="text-sm text-ink/60 mt-1">{loc(c, "description")}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.limit_period !== "none" && c.limit_count ? (
                            <Badge variant="secondary" className="text-[11px]">
                              {k.max} {c.limit_count} / {c.limit_period === "weekly" ? k.perWeek : k.perMonth}
                            </Badge>
                          ) : null}
                          {c.requires_evidence ? (
                            <Badge variant="secondary" className="text-[11px]">{k.requiresEvidence}</Badge>
                          ) : null}
                          {!c.member_requestable ? (
                            <Badge variant="secondary" className="text-[11px]">{k.teamAssigns}</Badge>
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
                  <p className="font-semibold mt-2">{loc(r, "name")}</p>
                  {loc(r, "description") ? (
                    <p className="text-sm text-ink/60 mt-1 flex-1">{loc(r, "description")}</p>
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
                      {soldOut ? k.soldOut : affordable ? k.redeem : k.insufficientBalance}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="referidos" className="space-y-4 pt-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-coral" />
              <h2 className="font-display text-lg font-bold">{k.bringSomeoneNew}</h2>
            </div>
            <p className="text-sm text-ink/60 mt-1">
              {k.referralIntro}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end mt-4">
              <div className="space-y-1.5">
                <Label>{k.referredNameLabel}</Label>
                <Input
                  value={referredName}
                  onChange={(e) => setReferredName(e.target.value)}
                  placeholder={k.referredNamePlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{k.noteOptionalLabel}</Label>
                <Input
                  value={referralNote}
                  onChange={(e) => setReferralNote(e.target.value)}
                  placeholder={k.notePlaceholder}
                />
              </div>
              <Button onClick={handleAddReferral} disabled={saving || referredName.trim().length < 2}>
                {k.register}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {referrals.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">{k.noReferrals}</p>
            ) : (
              referrals.map((r) => (
                <div key={r.id} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{r.referred_name}</p>
                    {r.note ? <p className="text-sm text-ink/60">{r.note}</p> : null}
                    <p className="text-xs text-ink/40 mt-1">
                      {new Date(r.created_at).toLocaleDateString(k.dateLocale)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <Badge variant="secondary" className="text-[11px]">
                      {r.signup_awarded ? k.signupAwarded : k.signupPending}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                      {r.loyalty_awarded ? k.loyaltyAwarded : k.loyaltyPending}
                    </Badge>
                  </div>
                </div>
              ))
            )}
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
                        {k.statusLabels[e.status] ?? e.status}
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
                        {k.statusLabels[r.status] ?? r.status}
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
              {k.wantAppearRanking}
            </Label>
          </div>
          {ranking.length > 0 ? (
            <div className="rounded-2xl border-2 border-coral/40 bg-coral/10 p-5 flex items-center gap-4">
              {ranking[0].avatarUrl ? (
                <img width={56} height={56} loading="lazy" decoding="async" src={getOptimizedImageUrl(ranking[0].avatarUrl, { width: 112, height: 112 })} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-ink/10" />
              )}
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-ink/60 font-semibold flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-coral" /> {k.memberOfTheMonth}
                </p>
                <p className="font-display text-2xl font-bold">{ranking[0].name}</p>
              </div>
              <span className="font-display text-2xl font-bold text-coral">{ranking[0].points} pts</span>
            </div>
          ) : null}
          <div className="rounded-xl border border-ink/10 bg-white divide-y divide-ink/10">
            {ranking.length === 0 ? (
              <p className="p-4 text-sm text-ink/50">{k.noRankingYet}</p>
            ) : (
              ranking.map((r, i) => (
                <div key={r.userId} className="p-3 flex items-center gap-3">
                  <span className="w-6 text-center font-display font-bold text-ink/50">{i + 1}</span>
                  {r.avatarUrl ? (
                    <img width={32} height={32} loading="lazy" decoding="async" src={getOptimizedImageUrl(r.avatarUrl, { width: 64, height: 64 })} alt="" className="h-8 w-8 rounded-full object-cover" />
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
            <h3 className="font-display font-bold mb-2">{k.levels}</h3>
            <ul className="text-sm space-y-1 text-ink/70">
              {KARMA_LEVELS.map((l) => (
                <li key={l.key}>
                  <strong>{pickLocalized(locale, { es: l.name, ca: l.name_ca, en: l.name_en })}</strong> — {l.min}
                  {l.max ? `–${l.max}` : "+"} pts · {pickLocalized(locale, { es: l.perk, ca: l.perk_ca, en: l.perk_en })}
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
            <DialogTitle>{k.registerContributionDialogTitle}</DialogTitle>
            <DialogDescription>
              {k.registerContributionDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{k.category}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={k.chooseCategory} />
                </SelectTrigger>
                <SelectContent>
                  {(catalog?.categories ?? [])
                    .filter((c) => c.member_requestable)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {loc(c, "name")} (+{c.points})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{k.description}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={k.descriptionPlaceholder}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {k.evidence} {selectedCategory?.requires_evidence ? k.mandatory : k.optionalParen}
              </Label>
              <Input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder={k.evidencePlaceholder}
              />
              <p className="text-xs text-ink/50">{k.orUploadImage}</p>
              <ImagePicker
                url={evidenceUrl && /^https?:\/\//.test(evidenceUrl) && /\.(png|jpe?g|webp|gif|avif)$/i.test(evidenceUrl) ? evidenceUrl : ""}
                onChange={(u) => setEvidenceUrl(u)}
                height="h-28"
                label={k.uploadImageLabel}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>
              {k.cancel}
            </Button>
            <Button onClick={handleSubmitEntry} disabled={!categoryId || saving}>
              {saving ? k.sendingEntry : k.sendEntry}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canjear recompensa */}
      <Dialog open={!!rewardOpen} onOpenChange={(o) => !o && setRewardOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{k.redeemDialogTitle(rewardOpen ? loc(rewardOpen, "name") : "")}</DialogTitle>
            <DialogDescription>
              {k.redeemDialogDesc(rewardOpen?.cost ?? 0)}
            </DialogDescription>
          </DialogHeader>
          {rewardOpen?.effect === "extend_rental" ? (
            <div className="space-y-1.5">
              <Label>{k.rentalToExtend}</Label>
              <Select value={targetRental} onValueChange={setTargetRental}>
                <SelectTrigger>
                  <SelectValue placeholder={k.chooseActiveRental} />
                </SelectTrigger>
                <SelectContent>
                  {(mine?.activeRentals ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title ?? k.game} — {k.dueOn(new Date(r.dueAt).toLocaleDateString(k.dateLocale))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardOpen(null)}>
              {k.cancel}
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={saving || (rewardOpen?.effect === "extend_rental" && !targetRental)}
            >
              {saving ? k.redeeming : k.confirmRedeem}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
