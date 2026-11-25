import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Grid3X3,
  Music,
  Settings2,
  Shuffle,
  Swords,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarEditor, avatarUri, randomAvatarConfig, type AvatarConfig } from "@/components/retos/AvatarEditor";
import { HitsterBoard } from "@/components/hitster/HitsterBoard";
import { HitsterCategoryIcon } from "@/components/hitster/HitsterCategoryIcon";
import {
  HITSTER_CATEGORIES,
  HITSTER_COLORS,
  HITSTER_COLOR_STYLES,
  hasSubmittedAnswer,
  type HitsterLang,
  type HitsterSide,
} from "@/lib/hitster";
import { ht } from "@/lib/hitster-i18n";
import {
  hitsterJoin,
  hitsterMarkCell,
  hitsterPlayerState,
  hitsterPublicGame,
  hitsterPunishRival,
  hitsterRecover,
  hitsterSetLanguage,
  hitsterSubmitAnswer,
  hitsterValidateAnswer,
} from "@/lib/hitster.functions";

export const Route = createFileRoute("/hitster/$slug")({
  loader: async ({ params }) => {
    const game = await hitsterPublicGame({ data: { slug: params.slug } });
    return { game, slug: params.slug };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.game ? `${loaderData.game.title} · Hitster — KLEFF` : "Hitster — KLEFF";
    const desc = loaderData?.game
      ? `Juega al bingo musical Hitster en KLEFF: ${loaderData.game.title}.`
      : "Bingo musical Hitster en KLEFF.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: HitsterPlayerRoute,
});

const STORAGE_PREFIX = "kleff_hitster_token_";

function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas error"));
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagen no válida"));
    };
    img.src = url;
  });
}

function LangSwitch({ lang, onChange }: { lang: HitsterLang; onChange: (l: HitsterLang) => void }) {
  return (
    <div className="inline-flex rounded-full border bg-muted/60 p-0.5 text-xs font-semibold">
      {(["es", "ca", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 rounded-full uppercase transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function HitsterPlayerRoute() {
  const [qc] = useState(() => new QueryClient());
  return <QueryClientProvider client={qc}><HitsterPlayerInner /></QueryClientProvider>;
}

function HitsterPlayerInner() {
  const { game, slug } = Route.useLoaderData();
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<HitsterLang>("es");
  const [justRegisteredCode, setJustRegisteredCode] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_PREFIX + slug);
    if (saved) setToken(saved);
    setHydrated(true);
  }, [slug]);

  const setLangFn = useServerFn(hitsterSetLanguage);
  const handleLangChange = (next: HitsterLang) => {
    setLang(next);
    if (token) void setLangFn({ data: { token, language: next } }).catch(() => {});
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-2">
          <Music className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="font-display text-xl font-bold">{ht("notFound", lang)}</h1>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!token) {
    return (
      <JoinScreen
        slug={slug}
        title={game.title}
        side={game.side}
        lang={lang}
        onLangChange={handleLangChange}
        onJoined={(t, code, isNew) => {
          window.localStorage.setItem(STORAGE_PREFIX + slug, t);
          setToken(t);
          if (isNew) setJustRegisteredCode(code);
        }}
      />
    );
  }

  if (justRegisteredCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center space-y-4">
          <Music className="h-10 w-10 mx-auto text-primary" />
          <h1 className="font-display text-xl font-bold">{ht("yourCodeTitle", lang)}</h1>
          <p className="text-sm text-muted-foreground">{ht("yourCodeDesc", lang)}</p>
          <div className="rounded-xl bg-muted py-4 font-mono text-3xl font-bold tracking-[0.25em]">
            {justRegisteredCode}
          </div>
          <Button className="w-full" size="lg" onClick={() => setJustRegisteredCode(null)}>
            {ht("startPlaying", lang)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PlayerDashboard
      slug={slug}
      token={token}
      lang={lang}
      onLangChange={handleLangChange}
      onSessionInvalid={() => {
        window.localStorage.removeItem(STORAGE_PREFIX + slug);
        setToken(null);
      }}
    />
  );
}

function JoinScreen({
  slug,
  title,
  side,
  lang,
  onLangChange,
  onJoined,
}: {
  slug: string;
  title: string;
  side: HitsterSide;
  lang: HitsterLang;
  onLangChange: (l: HitsterLang) => void;
  onJoined: (token: string, code: string, isNew: boolean) => void;
}) {
  const joinFn = useServerFn(hitsterJoin);
  const recoverFn = useServerFn(hitsterRecover);
  const [mode, setMode] = useState<"join" | "recover">("join");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [avatarCfg, setAvatarCfg] = useState<AvatarConfig>(() => randomAvatarConfig());
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarSrc = customPhoto ?? avatarUri(avatarCfg);

  const joinM = useMutation({
    mutationFn: () => joinFn({ data: { slug, nickname, avatar_url: avatarSrc, language: lang } }),
    onSuccess: (p) => onJoined(p.token, p.access_code, true),
    onError: (e: Error) => toast.error(e.message),
  });

  const recoverM = useMutation({
    mutationFn: () => recoverFn({ data: { slug, code } }),
    onSuccess: (p) => {
      onLangChange(p.language);
      onJoined(p.token, p.access_code, false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{side === "A" ? ht("sideA", lang) : ht("sideB", lang)}</Badge>
          <LangSwitch lang={lang} onChange={onLangChange} />
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-5">
          <div className="text-center space-y-1">
            <Music className="h-8 w-8 mx-auto text-primary" />
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{ht("createTitle", lang)}</p>
          </div>

          {mode === "join" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                joinM.mutate();
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <img src={avatarSrc} alt="" className="h-24 w-24 rounded-full border-4 border-primary/20 bg-muted object-cover" />
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => { setCustomPhoto(null); setAvatarCfg(randomAvatarConfig()); }}
                  >
                    <Shuffle className="h-3.5 w-3.5 mr-1" /> {ht("randomAvatar", lang)}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
                    <Settings2 className="h-3.5 w-3.5 mr-1" /> {ht("customizeAvatar", lang)}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> {ht("uploadPhoto", lang)}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setCustomPhoto(await compressPhoto(f));
                    } catch {
                      toast.error("Imagen no válida");
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="h-nick">{ht("nicknameLabel", lang)}</Label>
                <Input
                  id="h-nick"
                  required
                  minLength={2}
                  maxLength={30}
                  placeholder={ht("nicknamePlaceholder", lang)}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={joinM.isPending}>
                {ht("joinBtn", lang)}
              </Button>

              <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setMode("recover")}>
                {ht("haveCode", lang)}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                recoverM.mutate();
              }}
            >
              <Input
                required
                placeholder={ht("codePlaceholder", lang)}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg tracking-widest uppercase"
              />
              <Button type="submit" className="w-full" size="lg" disabled={recoverM.isPending}>
                {ht("recoverBtn", lang)}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => setMode("join")}>
                {ht("backCreate", lang)}
              </Button>
            </form>
          )}
        </div>
      </div>

      <AvatarEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={avatarCfg}
        lang={lang}
        onSave={(cfg) => { setCustomPhoto(null); setAvatarCfg(cfg); }}
      />
    </div>
  );
}

function PlayerDashboard({
  slug,
  token,
  lang,
  onLangChange,
  onSessionInvalid,
}: {
  slug: string;
  token: string;
  lang: HitsterLang;
  onLangChange: (l: HitsterLang) => void;
  onSessionInvalid: () => void;
}) {
  const qc = useQueryClient();
  const stateFn = useServerFn(hitsterPlayerState);
  const answerFn = useServerFn(hitsterSubmitAnswer);
  const validateFn = useServerFn(hitsterValidateAnswer);
  const markFn = useServerFn(hitsterMarkCell);
  const punishFn = useServerFn(hitsterPunishRival);

  const [tab, setTab] = useState<"board" | "categories" | "participants">("board");
  const [answerDraft, setAnswerDraft] = useState("");
  const [draftRoundId, setDraftRoundId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [punishOpen, setPunishOpen] = useState(false);
  const [punishRivalId, setPunishRivalId] = useState<string | null>(null);

  const qKey = ["hitster-player", slug, token];
  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => stateFn({ data: { token } }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!isLoading && data === null) onSessionInvalid();
  }, [data, isLoading, onSessionInvalid]);

  useEffect(() => {
    if (data?.me.language && data.me.language !== lang) onLangChange(data.me.language);
  }, [data?.me.language]);

  useEffect(() => {
    const rid = data?.currentRound?.id ?? null;
    if (rid !== draftRoundId) {
      setDraftRoundId(rid);
      setAnswerDraft(data?.myAnswer?.answer_text ?? "");
      setPunishOpen(false);
      setPunishRivalId(null);
    }
  }, [data?.currentRound?.id, data?.myAnswer?.answer_text, draftRoundId]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const invalidate = () => qc.invalidateQueries({ queryKey: qKey });

  const submitM = useMutation({
    mutationFn: () => answerFn({ data: { token, roundId: data!.currentRound!.id, answer_text: answerDraft } }),
    onSuccess: () => { toast.success(ht("answerSaved", lang)); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const validateM = useMutation({
    mutationFn: (vars: { is_correct: boolean; is_exact_year?: boolean }) =>
      validateFn({ data: { token, roundId: data!.currentRound!.id, ...vars } }),
    onSuccess: (res) => {
      if (res.is_exact_year) setPunishOpen(true);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markM = useMutation({
    mutationFn: (cellIndex: number) => markFn({ data: { token, roundId: data!.currentRound!.id, cellIndex } }),
    onSuccess: () => { toast.success(ht("markedDone", lang)); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const punishM = useMutation({
    mutationFn: (vars: { rivalId: string; cellIndex: number }) =>
      punishFn({ data: { token, roundId: data!.currentRound!.id, ...vars } }),
    onSuccess: () => {
      toast.success(ht("punishDone", lang));
      setPunishOpen(false);
      setPunishRivalId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">…</div>;
  }

  const { game, me, currentRound, myAnswer, participants } = data;
  const cats = HITSTER_CATEGORIES[game.side];
  const serverDelta = data.serverNow - nowTick;
  const remainingSec = currentRound
    ? Math.max(0, Math.ceil((new Date(currentRound.ends_at).getTime() - (nowTick + serverDelta)) / 1000))
    : 0;

  const isTiebreak = game.status === "tiebreak";
  const inTiebreak = isTiebreak && game.tiebreak_participant_ids.includes(me.id);
  const canParticipateInRound = game.status === "playing" || inTiebreak;

  const activeCat = currentRound && currentRound.phase !== "closed" ? cats[currentRound.category_key] : null;
  const activeStyle = currentRound && currentRound.phase !== "closed" ? HITSTER_COLOR_STYLES[currentRound.category_key] : null;
  const didSubmitAnswer = hasSubmittedAnswer(myAnswer);

  const hasUnmarkedOfActive = Boolean(
    currentRound && me.board.some((c, i) => c === currentRound.category_key && !me.marks[i]),
  );
  const canMarkNow = Boolean(
    currentRound &&
      currentRound.phase === "validating" &&
      !isTiebreak &&
      didSubmitAnswer &&
      myAnswer?.is_correct === true &&
      myAnswer.marked_cell === null &&
      hasUnmarkedOfActive,
  );
  const canPunishNow = Boolean(
    currentRound &&
      currentRound.phase === "validating" &&
      myAnswer?.is_exact_year === true &&
      !myAnswer.punished_participant_id,
  );

  const rivalsWithMarks = participants.filter((p) => p.id !== me.id && p.marksCount > 0);
  const selectedRival = rivalsWithMarks.find((r) => r.id === punishRivalId) ?? null;
  const winners = participants.filter((p) => game.winner_participant_ids.includes(p.id));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur px-4 py-2.5">
        <div className="mx-auto max-w-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={me.avatar_url} alt="" className="h-8 w-8 rounded-full border bg-muted shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{me.nickname}</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {ht("codeLabel", lang)} {me.access_code}
              </p>
            </div>
          </div>
          <LangSwitch lang={lang} onChange={onLangChange} />
        </div>
      </header>

      <main className="mx-auto max-w-md p-4 space-y-4">
        {game.status === "finished" && winners.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase text-amber-700">{ht("winnerBanner", lang)}</p>
              <p className="font-display text-lg font-bold">{winners.map((w) => w.nickname).join(", ")}</p>
            </div>
          </div>
        )}

        {isTiebreak && (
          <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {inTiebreak ? ht("tiebreakBanner", lang) : ht("tiebreakSpectator", lang)}
          </div>
        )}

        {tab === "board" && (
          <div className="space-y-4">
            {game.status === "draft" && (
              <div className="rounded-2xl border bg-card p-5 text-center space-y-2">
                <Music className="h-8 w-8 mx-auto text-primary animate-pulse" />
                <p className="font-medium text-sm">{ht("waitingStart", lang)}</p>
              </div>
            )}

            {game.status !== "draft" && game.status !== "finished" && !activeCat && (
              <div className="rounded-2xl border bg-card p-5 text-center space-y-2">
                <Clock className="h-7 w-7 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{ht("waitingRound", lang)}</p>
              </div>
            )}

            {activeCat && activeStyle && currentRound && (
              <div className={`rounded-2xl border-2 p-4 space-y-3 ${activeStyle.border} ${activeStyle.soft}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-9 w-9 rounded-lg ${activeStyle.bg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <HitsterCategoryIcon side={game.side} color={currentRound.category_key} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        {ht("roundLabel", lang)} #{currentRound.round_number}
                      </p>
                      <p className="font-display font-bold text-base leading-tight">{activeCat.name[lang]}</p>
                    </div>
                  </div>
                  {currentRound.phase === "answering" && (
                    <div className={`text-2xl font-mono font-bold tabular-nums ${remainingSec <= 5 ? "text-destructive animate-pulse" : ""}`}>
                      {remainingSec}s
                    </div>
                  )}
                </div>

                {canParticipateInRound && currentRound.phase === "answering" && (
                  remainingSec > 0 ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitM.mutate();
                      }}
                    >
                      <Input
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        placeholder={activeCat.placeholder[lang]}
                        className="bg-background"
                        maxLength={200}
                      />
                      <Button type="submit" disabled={submitM.isPending || !answerDraft.trim()}>
                        {ht("saveAnswer", lang)}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-xs font-medium text-muted-foreground text-center py-1">{ht("timeUp", lang)}</p>
                  )
                )}

                {canParticipateInRound && currentRound.phase === "validating" && !didSubmitAnswer && (
                  <p className="text-xs font-medium text-center text-muted-foreground py-1">
                    {ht("noAnswerSent", lang)}
                  </p>
                )}

                {canParticipateInRound && currentRound.phase === "validating" && didSubmitAnswer && myAnswer?.is_correct == null && (
                  <div className="rounded-xl bg-background border-2 border-primary p-4 space-y-3 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-center gap-2 text-primary font-display font-bold text-lg">
                      <CheckCircle2 className="h-5 w-5" /> {ht("validateTitle", lang)}
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {ht("yourAnswerWas", lang)}{" "}
                      <strong className="text-foreground">{myAnswer?.answer_text || ht("noAnswerWritten", lang)}</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="default"
                        disabled={validateM.isPending}
                        onClick={() => validateM.mutate({ is_correct: true, is_exact_year: false })}
                      >
                        <Check className="h-4 w-4 mr-1" /> {ht("yesCorrect", lang)}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={validateM.isPending}
                        onClick={() => validateM.mutate({ is_correct: false })}
                      >
                        <X className="h-4 w-4 mr-1" /> {ht("noWrong", lang)}
                      </Button>
                    </div>
                    {activeCat.allowExactBonus && !isTiebreak && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled={validateM.isPending}
                        onClick={() => validateM.mutate({ is_correct: true, is_exact_year: true })}
                      >
                        <Swords className="h-4 w-4 mr-1.5" /> {ht("yesExact", lang)}
                      </Button>
                    )}
                  </div>
                )}

                {canMarkNow && (
                  <p className="text-xs font-semibold text-center text-foreground animate-pulse">
                    {ht("pickCellHint", lang)}
                  </p>
                )}
                {currentRound.phase === "validating" && myAnswer?.is_correct === true && !hasUnmarkedOfActive && !isTiebreak && (
                  <p className="text-xs text-center text-muted-foreground">{ht("allColorMarked", lang)}</p>
                )}
                {currentRound.phase === "validating" && myAnswer?.is_correct === true && myAnswer.marked_cell !== null && (
                  <p className="text-xs font-semibold text-center text-emerald-700">{ht("markedDone", lang)}</p>
                )}
                {currentRound.phase === "validating" && myAnswer?.is_correct === false && (
                  <p className="text-xs text-center text-muted-foreground">{ht("missedRound", lang)}</p>
                )}

                {canPunishNow && (
                  <Button size="sm" variant="destructive" className="w-full" onClick={() => setPunishOpen(true)}>
                    <Swords className="h-4 w-4 mr-1.5" /> {ht("punishBtn", lang)}
                  </Button>
                )}
              </div>
            )}

            <div className="rounded-2xl border bg-card p-3">
              <HitsterBoard
                board={me.board}
                marks={me.marks}
                side={game.side}
                activeColor={currentRound && currentRound.phase !== "closed" ? currentRound.category_key : null}
                canMark={canMarkNow}
                onCellClick={(idx) => markM.mutate(idx)}
              />
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{ht("categoriesIntro", lang)}</p>
            {HITSTER_COLORS.map((c) => {
              const def = cats[c];
              const st = HITSTER_COLOR_STYLES[c];
              return (
                <div key={c} className={`rounded-xl border-2 p-4 space-y-1.5 ${st.border} ${st.soft}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`h-7 w-7 rounded-md ${st.bg} text-white flex items-center justify-center shrink-0`}>
                      <HitsterCategoryIcon side={game.side} color={c} className="h-4 w-4" />
                    </span>
                    <h2 className="font-display font-bold text-base">{def.name[lang]}</h2>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{def.description[lang]}</p>
                </div>
              );
            })}
          </div>
        )}

        {tab === "participants" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{ht("participantsIntro", lang)}</p>
            <div className="grid grid-cols-2 gap-3">
              {participants.map((p) => (
                <div key={p.id} className={`rounded-xl border bg-card p-3 space-y-2 ${p.hasLine ? "border-amber-500" : ""}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full border bg-muted shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{p.nickname}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.marksCount}/25 {p.hasLine ? `· ${ht("lineDone", lang)}` : ""}
                      </p>
                    </div>
                  </div>
                  <HitsterBoard board={p.board} marks={p.marks} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Exact-year rival punishment dialog */}
      <Dialog open={punishOpen} onOpenChange={setPunishOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ht("punishTitle", lang)}</DialogTitle>
          </DialogHeader>
          {rivalsWithMarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ht("punishNoMarks", lang)}</p>
          ) : !selectedRival ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{ht("punishPickRival", lang)}</p>
              {rivalsWithMarks.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setPunishRivalId(r.id)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border p-2.5 hover:bg-muted/50 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-full border bg-muted shrink-0" />
                    <span className="font-semibold text-sm truncate">{r.nickname}</span>
                  </div>
                  <Badge variant="outline">{r.marksCount}/25</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={selectedRival.avatar_url} alt="" className="h-8 w-8 rounded-full border bg-muted" />
                  <span className="font-semibold text-sm">{selectedRival.nickname}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPunishRivalId(null)}>
                  {ht("backToRivals", lang)}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{ht("punishPickCell", lang)}</p>
              <HitsterBoard
                board={selectedRival.board}
                marks={selectedRival.marks}
                punishMode
                onCellClick={(cellIndex) => punishM.mutate({ rivalId: selectedRival.id, cellIndex })}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile-first bottom navigation (3 tabs) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-md grid grid-cols-3">
          {(
            [
              { id: "board", label: ht("tabBoard", lang), icon: Grid3X3 },
              { id: "categories", label: ht("tabCategories", lang), icon: BookOpen },
              { id: "participants", label: ht("tabParticipants", lang), icon: Users },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center justify-center py-2.5 gap-1 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}