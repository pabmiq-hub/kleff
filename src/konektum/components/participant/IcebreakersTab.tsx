// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/konektum/supabase";
import { Card } from "@/konektum/ui/card";
import { ChevronRight, Info, Loader2 } from "lucide-react";
import { ICEBREAKER_META, type IcebreakerGameCode } from "@/konektum/lib/icebreakers";
import SocialGameTab from "@/konektum/components/event/SocialGameTab";
import BuildYourselfGame from "./BuildYourselfGame";
import TimelineGame from "./TimelineGame";
import EmojiStoryGame from "./EmojiStoryGame";

interface Props {
  eventId: string;
  verificationCode: string;
  lang: "es" | "en";
  games: IcebreakerGameCode[];
  onRewardsChange?: () => void;
}

const IcebreakersTab = ({ eventId, verificationCode, lang, games, onRewardsChange }: Props) => {
  const [active, setActive] = useState<IcebreakerGameCode | null>(null);
  const [chosenByName, setChosenByName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const t = (es: string, en: string) => (lang === "en" ? en : es);

  const sync = useCallback(
    async (action: "state" | "select" | "reset", gameCode?: IcebreakerGameCode) => {
      const { data, error } = await supabase.functions.invoke("icebreaker-select", {
        body: { eventId, verificationCode, action, gameCode },
      });
      if (error || !data || (data as any).error) return;
      const game = (data as any).activeGame as IcebreakerGameCode | null;
      setActive(game && games.includes(game) ? game : null);
      setChosenByName((data as any).chosenByMe ? null : (data as any).chosenByName || null);
    },
    [eventId, verificationCode, games],
  );

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      await sync("state");
      if (!cancelled) setLoading(false);
    };
    tick();
    const id = setInterval(() => {
      if (!cancelled) sync("state");
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sync]);

  if (games.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t("No hay juegos disponibles en este evento.", "No games are available for this event.")}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const choose = async (code: IcebreakerGameCode) => {
    setSelecting(true);
    await sync("select", code);
    setSelecting(false);
  };


  if (!active) {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">{t("Juegos", "Games")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(
              "Elige un juego: se abrirá para todas las personas de tu mesa.",
              "Pick a game: it will open for everyone at your table.",
            )}
          </p>
        </div>
        {games.map((code) => {
          const meta = ICEBREAKER_META[code];
          return (
            <button
              key={code}
              type="button"
              disabled={selecting}
              onClick={() => choose(code)}
              className="w-full text-left disabled:opacity-60"
            >
              <Card className="p-4 flex items-center gap-3 hover:border-primary transition-colors">
                <span className="text-2xl" aria-hidden="true">
                  {meta.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{lang === "en" ? meta.name_en : meta.name_es}</p>
                  <p className="text-sm text-muted-foreground">
                    {lang === "en" ? meta.tagline_en : meta.tagline_es}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Card>
            </button>
          );
        })}
      </div>
    );
  }

  const meta = ICEBREAKER_META[active];
  const steps = lang === "en" ? meta.steps_en : meta.steps_es;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">
          {meta.emoji} {lang === "en" ? meta.name_en : meta.name_es}
        </h2>
      </div>

      {chosenByName && (
        <p className="text-xs text-muted-foreground">
          {t(`Elegido por ${chosenByName} en tu mesa.`, `Chosen by ${chosenByName} at your table.`)}
        </p>
      )}

      <Card className="p-4 bg-muted/40">
        <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
          <Info className="w-4 h-4" />
          {t("Cómo se juega", "How to play")}
        </p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Card>

      {active === "who_is_who" && (
        <SocialGameTab
          eventId={eventId}
          verificationCode={verificationCode}
          lang={lang}
          onRewardsChange={onRewardsChange}
        />
      )}
      {active === "build_yourself" && (
        <BuildYourselfGame
          eventId={eventId}
          verificationCode={verificationCode}
          lang={lang}
          onRewardsChange={onRewardsChange}
        />
      )}
      {active === "timeline" && (
        <TimelineGame
          eventId={eventId}
          verificationCode={verificationCode}
          lang={lang}
          onRewardsChange={onRewardsChange}
        />
      )}
      {active === "emoji_story" && (
        <EmojiStoryGame
          eventId={eventId}
          verificationCode={verificationCode}
          lang={lang}
          onRewardsChange={onRewardsChange}
        />
      )}
    </div>
  );
};

export default IcebreakersTab;
