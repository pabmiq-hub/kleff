// @ts-nocheck
import { Label } from "@/konektum/ui/label";
import { Textarea } from "@/konektum/ui/textarea";
import { FieldError } from "@/konektum/ui/field-error";
import { errorInputClass, fieldErrorMessage } from "@/konektum/lib/formErrors";
import { SOCIAL_GAME_MAX_LENGTH, socialGameLabel, type SocialGameAnswers, type SocialGameQuestion } from "@/konektum/lib/socialGame";

interface Props {
  questions: SocialGameQuestion[];
  lang: "es" | "en";
  values: SocialGameAnswers;
  onChange: (values: SocialGameAnswers) => void;
  /** Ids of questions flagged as missing after a failed submit */
  errors?: string[];
}

const SocialGameForm = ({ questions, lang, values, onChange, errors = [] }: Props) => {
  if (questions.length === 0) return null;

  const set = (id: string, v: string) => onChange({ ...values, [id]: v.slice(0, SOCIAL_GAME_MAX_LENGTH) });

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div>
        <h3 className="font-semibold text-sm">
          {lang === "en" ? "Who's who? game 🎭" : "Juego ¿Quién es quién? 🎭"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {lang === "en"
            ? "Your answers are shown anonymously at your table. Guess who wrote each one and win extra actions."
            : "Tus respuestas se mostrarán de forma anónima en tu mesa. Adivina quién escribió cada una y gana acciones extra."}
        </p>
      </div>

      {questions.map((q) => {
        const value = String(values?.[q.id] || "");
        const hasError = errors.includes(q.id);
        return (
          <div key={q.id} className="space-y-1.5" data-field-error={hasError ? "true" : undefined}>
            <Label htmlFor={`sg-${q.id}`} className={hasError ? "text-destructive" : undefined}>
              {socialGameLabel(q, lang)}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id={`sg-${q.id}`}
              value={value}
              onChange={(e) => set(q.id, e.target.value)}
              maxLength={SOCIAL_GAME_MAX_LENGTH}
              rows={2}
              placeholder={lang === "en" ? "Your answer..." : "Tu respuesta..."}
              className={hasError ? errorInputClass : undefined}
            />
            <FieldError show={hasError} message={fieldErrorMessage(lang)} />
            <p className="text-[11px] text-muted-foreground text-right">
              {value.length}/{SOCIAL_GAME_MAX_LENGTH}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default SocialGameForm;
