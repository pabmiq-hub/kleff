// @ts-nocheck
import { Label } from "@/konektum/ui/label";
import { Input } from "@/konektum/ui/input";
import { Switch } from "@/konektum/ui/switch";
import { Button } from "@/konektum/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_BUILD_SECONDS,
  DEFAULT_EMOJI_COMPOSE_SECONDS,
  DEFAULT_EMOJI_GUESS_SECONDS,
  DEFAULT_TIMELINE_CREATE_SECONDS,
  DEFAULT_TIMELINE_GUESS_SECONDS,
  ICEBREAKER_META,
  type IcebreakersConfig,
} from "@/konektum/lib/icebreakers";
import { DEFAULT_SOCIAL_GAME_QUESTIONS, type SocialGameQuestion } from "@/konektum/lib/socialGame";

interface Props {
  value: IcebreakersConfig;
  onChange: (v: IcebreakersConfig) => void;
  /** Timeline y Emoji Story necesitan los datos del Modo Wrapped. */
  wrappedEnabled?: boolean;
}

const IcebreakersEditor = ({ value, onChange, wrappedEnabled = true }: Props) => {
  const who = value.games.who_is_who;
  const build = value.games.build_yourself;
  const timeline = value.games.timeline;
  const emoji = value.games.emoji_story;
  const questions: SocialGameQuestion[] = who.questions.length > 0 ? who.questions : DEFAULT_SOCIAL_GAME_QUESTIONS;
  const wrappedNotice = (
    <p className="text-xs text-amber-600 dark:text-amber-500">
      Requiere el <strong>Modo Wrapped</strong> activado: los hitos y las preguntas se generan a partir de las
      respuestas de intereses.
    </p>
  );


  const setWho = (patch: Partial<typeof who>) =>
    onChange({ ...value, games: { ...value.games, who_is_who: { ...who, questions, ...patch } } });
  const setBuild = (patch: Partial<typeof build>) =>
    onChange({ ...value, games: { ...value.games, build_yourself: { ...build, ...patch } } });
  const setTimeline = (patch: Partial<typeof timeline>) =>
    onChange({ ...value, games: { ...value.games, timeline: { ...timeline, ...patch } } });
  const setEmoji = (patch: Partial<typeof emoji>) =>
    onChange({ ...value, games: { ...value.games, emoji_story: { ...emoji, ...patch } } });

  const updateQuestion = (index: number, patch: Partial<SocialGameQuestion>) =>
    setWho({ questions: questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <Label className="text-base">🧊 Juegos</Label>
          <p className="text-sm text-muted-foreground">
            Sección de juegos en el panel del participante. Activa los juegos que quieras poner a disposición de
            las mesas durante el evento. Los aciertos desbloquean acciones extra: 1 acierto → Super Like extra ·
            3 aciertos → también Repetir · pleno → también Flechazo.
          </p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} />
      </div>

      {value.enabled && (
        <div className="space-y-4 pt-3 border-t">
          {/* ¿Quién es quién? */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>{ICEBREAKER_META.who_is_who.emoji} {ICEBREAKER_META.who_is_who.name_es}</Label>
                <p className="text-sm text-muted-foreground">
                  Los participantes responden estas preguntas al inscribirse y en cada ronda adivinan quién escribió
                  cada respuesta anónima de su mesa.
                </p>
              </div>
              <Switch checked={who.enabled} onCheckedChange={(v) => setWho({ enabled: v })} />
            </div>

            {who.enabled && (
              <div className="space-y-3 pt-2 border-t">
                {questions.map((q, i) => (
                  <div key={q.id} className="space-y-2 p-3 rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Pregunta {i + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setWho({ questions: questions.filter((_, idx) => idx !== i) })}
                        disabled={questions.length <= 1}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={q.label_es}
                      onChange={(e) => updateQuestion(i, { label_es: e.target.value })}
                      placeholder="Texto en castellano"
                    />
                    <Input
                      value={q.label_en}
                      onChange={(e) => updateQuestion(i, { label_en: e.target.value })}
                      placeholder="Text in English"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setWho({ questions: [...questions, { id: `q_${Date.now()}`, label_es: "", label_en: "" }] })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir pregunta
                </Button>
              </div>
            )}
          </div>

          {/* Constrúyete */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>{ICEBREAKER_META.build_yourself.emoji} {ICEBREAKER_META.build_yourself.name_es}</Label>
                <p className="text-sm text-muted-foreground">
                  Cada persona construye un avatar que la represente (piezas de pelo, cara, ropa y complementos, o
                  dibujándolo). Cuando toda la mesa está lista, se muestran los avatares sin nombre y hay que
                  adivinar quién es quién.
                </p>
              </div>
              <Switch checked={build.enabled} onCheckedChange={(v) => setBuild({ enabled: v })} />
            </div>

            {build.enabled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <Label className="text-sm">Sugerir piezas según su formulario</Label>
                    <p className="text-xs text-muted-foreground">
                      Presugiere complementos a partir de los intereses y respuestas que ya facilitaron. Pueden
                      quitarlos.
                    </p>
                  </div>
                  <Switch checked={build.prefill} onCheckedChange={(v) => setBuild({ prefill: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <Label className="text-sm">Permitir dibujar el avatar</Label>
                    <p className="text-xs text-muted-foreground">
                      Añade un lienzo libre con colores y grosores como alternativa a las piezas.
                    </p>
                  </div>
                  <Switch checked={build.allow_drawing} onCheckedChange={(v) => setBuild({ allow_drawing: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tiempo sugerido de construcción (segundos)</Label>
                  <Input
                    type="number"
                    min={30}
                    max={600}
                    value={build.build_seconds}
                    onChange={(e) =>
                      setBuild({ build_seconds: Number(e.target.value) || DEFAULT_BUILD_SECONDS })
                    }
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>{ICEBREAKER_META.timeline.emoji} {ICEBREAKER_META.timeline.name_es}</Label>
                <p className="text-sm text-muted-foreground">
                  Cada persona ordena cronológicamente 4-5 hitos generados a partir de sus hobbies y respuestas.
                  Por turnos, el resto de la mesa intenta adivinar el orden real del protagonista.
                </p>
                {!wrappedEnabled && wrappedNotice}
              </div>
              <Switch
                checked={timeline.enabled && wrappedEnabled}
                disabled={!wrappedEnabled}
                onCheckedChange={(v) => setTimeline({ enabled: v })}
              />
            </div>

            {timeline.enabled && wrappedEnabled && (

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-sm">Tiempo para crear la timeline (s)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={600}
                    value={timeline.create_seconds}
                    onChange={(e) =>
                      setTimeline({ create_seconds: Number(e.target.value) || DEFAULT_TIMELINE_CREATE_SECONDS })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tiempo por turno para ordenar (s)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={600}
                    value={timeline.guess_seconds}
                    onChange={(e) =>
                      setTimeline({ guess_seconds: Number(e.target.value) || DEFAULT_TIMELINE_GUESS_SECONDS })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Emoji Story */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <Label>{ICEBREAKER_META.emoji_story.emoji} {ICEBREAKER_META.emoji_story.name_es}</Label>
                <p className="text-sm text-muted-foreground">
                  Cada persona recibe una pregunta personalizada según su formulario y responde con 4-6 emojis.
                  La mesa comenta las historias, adivina quién escribió cada secuencia y se revela el texto real.
                </p>
                {!wrappedEnabled && wrappedNotice}
              </div>
              <Switch
                checked={emoji.enabled && wrappedEnabled}
                disabled={!wrappedEnabled}
                onCheckedChange={(v) => setEmoji({ enabled: v })}
              />
            </div>

            {emoji.enabled && wrappedEnabled && (

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-sm">Tiempo para componer (s)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={600}
                    value={emoji.compose_seconds}
                    onChange={(e) =>
                      setEmoji({ compose_seconds: Number(e.target.value) || DEFAULT_EMOJI_COMPOSE_SECONDS })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tiempo por historia para adivinar (s)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={600}
                    value={emoji.guess_seconds}
                    onChange={(e) =>
                      setEmoji({ guess_seconds: Number(e.target.value) || DEFAULT_EMOJI_GUESS_SECONDS })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IcebreakersEditor;
