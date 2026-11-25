import { useEffect, useState } from "react";
import { Clock, Grid3X3, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HitsterLang } from "@/lib/hitster";
import { ht, type HitsterTKey } from "@/lib/hitster-i18n";

const STEPS: ReadonlyArray<{ Icon: typeof Grid3X3; title: HitsterTKey; body: HitsterTKey }> = [
  { Icon: Grid3X3, title: "tutorialStep1Title", body: "tutorialStep1Body" },
  { Icon: Clock, title: "tutorialStep2Title", body: "tutorialStep2Body" },
  { Icon: Swords, title: "tutorialStep3Title", body: "tutorialStep3Body" },
  { Icon: Users, title: "tutorialStep4Title", body: "tutorialStep4Body" },
];

export function HitsterOnboarding({ lang, onClose }: { lang: HitsterLang; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const step = STEPS[index]!;
  const isLast = index === STEPS.length - 1;
  const go = (next: number) => setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={ht("tutorialOpenLabel", lang)}
    >
      <div
        className="mx-auto w-full max-w-md rounded-t-2xl border bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lg sm:rounded-2xl"
        onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const endX = e.changedTouches[0]?.clientX;
          if (touchStartX !== null && endX !== undefined && Math.abs(endX - touchStartX) > 50) {
            go(index + (endX < touchStartX ? 1 : -1));
          }
          setTouchStartX(null);
        }}
      >
        <div className="mb-2 flex justify-end">
          <button type="button" className="text-sm text-muted-foreground underline" onClick={onClose}>
            {ht("tutorialSkip", lang)}
          </button>
        </div>

        <div key={index} className="animate-in fade-in slide-in-from-right-4 text-center duration-300">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <step.Icon className="h-8 w-8" />
          </div>
          <h2 className="mb-2 font-display text-xl font-bold">{ht(step.title, lang)}</h2>
          <p className="min-h-[6.5rem] text-sm leading-relaxed text-muted-foreground">{ht(step.body, lang)}</p>
        </div>

        <div className="my-4 flex justify-center gap-2">
          {STEPS.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={String(k + 1)}
              onClick={() => go(k)}
              className={`h-2 rounded-full transition-all ${k === index ? "w-6 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {index > 0 && (
            <Button type="button" variant="outline" className="h-12 flex-1" onClick={() => go(index - 1)}>
              {ht("tutorialPrev", lang)}
            </Button>
          )}
          <Button type="button" className="h-12 flex-1" onClick={() => (isLast ? onClose() : go(index + 1))}>
            {ht(isLast ? "tutorialDone" : "tutorialNext", lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}