import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { MMAvatar } from "./shared";

/** Act title: letters appear one by one, then fades. */
export function ActIntro({ title, subtitle, onDone }: { title: string; subtitle?: string | null; onDone: () => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 1500 : 3800);
    return () => clearTimeout(t);
  }, [onDone, reduce]);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--mm-bg)]/95 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      <h2 className="text-3xl font-extrabold text-[var(--mm-accent)]" style={{ fontFamily: "var(--mm-font)" }}>
        {reduce
          ? title
          : title.split("").map((ch, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {ch}
              </motion.span>
            ))}
      </h2>
      {subtitle && (
        <motion.p className="mt-4 max-w-md opacity-80" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: reduce ? 0 : title.length * 0.04 + 0.3 }}>
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

/** The big moment: darkness, flicker, dramatic text. */
export function MurderOverlay({ event, onDone }: { event: { title?: string; text?: string; victim_name?: string } | null; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setStep(1), reduce ? 200 : 1600), setTimeout(() => setStep(2), reduce ? 400 : 2600)];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {!reduce && step === 0 && (
        <motion.div className="absolute inset-0 bg-[var(--mm-text)]" animate={{ opacity: [0, 0.9, 0, 0.6, 0, 0.3, 0] }} transition={{ duration: 1.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1] }} />
      )}
      {step >= 1 && (
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="max-w-md">
          <p className="text-4xl font-extrabold text-[var(--mm-primary)]" style={{ fontFamily: "var(--mm-font)" }}>
            {event?.title ?? "Ha habido un asesinato"}
          </p>
          {event?.text && <p className="mt-5 text-lg leading-relaxed text-[var(--mm-text)]">{event.text}</p>}
          {step >= 2 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onDone} className="mt-8 rounded-lg border border-[var(--mm-accent)] px-6 py-3 text-[var(--mm-accent)]">
              Empezar a investigar
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/** Step-by-step final reveal with confetti at the end. */
export function FinalReveal({
  results,
  onDone,
}: {
  results: { killer: { name: string; avatar_config?: any; avatar_url?: string | null } | null; final_reveal?: any; rows: any[] };
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const correct = results.rows.filter((r) => r.correct).length;
  const steps: ReactNode[] = [
    <div key="a">
      <p className="text-sm uppercase tracking-widest opacity-70">Aciertos</p>
      <p className="mt-2 text-6xl font-extrabold text-[var(--mm-accent)]">
        {correct}/{results.rows.length}
      </p>
      <p className="mt-2 opacity-80">jugadores descubrieron al culpable</p>
    </div>,
    <div key="b" className="flex flex-col items-center">
      <p className="text-sm uppercase tracking-widest opacity-70">El asesino era…</p>
      <motion.div className="relative mt-4" initial={reduce ? false : { scale: 0.8 }} animate={{ scale: 1 }}>
        {results.killer && <MMAvatar name={results.killer.name} config={results.killer.avatar_config} url={results.killer.avatar_url} size={140} />}
        {!reduce && (
          <motion.div className="absolute inset-0 rounded-full bg-[var(--mm-bg)]" initial={{ y: 0 }} animate={{ y: 220, opacity: 0 }} transition={{ delay: 0.6, duration: 1.2, ease: "easeIn" }} />
        )}
      </motion.div>
      <p className="mt-4 text-3xl font-extrabold text-[var(--mm-primary)]" style={{ fontFamily: "var(--mm-font)" }}>
        {results.killer?.name ?? "?"}
      </p>
    </div>,
    <div key="c" className="space-y-4 text-left">
      {results.final_reveal?.motive && (
        <p>
          <strong className="text-[var(--mm-accent)]">Móvil:</strong> {results.final_reveal.motive}
        </p>
      )}
      {results.final_reveal?.method && (
        <p>
          <strong className="text-[var(--mm-accent)]">Método:</strong> {results.final_reveal.method}
        </p>
      )}
      {results.final_reveal?.epilogue && <p className="italic opacity-80">{results.final_reveal.epilogue}</p>}
    </div>,
  ];
  useEffect(() => {
    if (step === steps.length) {
      if (!reduce) confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
      onDone();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  if (step >= steps.length) return null;
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--mm-bg)] px-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          {steps[step]}
        </motion.div>
      </AnimatePresence>
      <button onClick={() => setStep((s) => s + 1)} className="mt-10 rounded-lg bg-[var(--mm-primary)] px-6 py-3 font-semibold text-[var(--mm-text)]">
        {step < steps.length - 1 ? "Continuar" : "Ver resultados"}
      </button>
    </motion.div>
  );
}

/** Card that flips the first time it is opened. */
export function FlipCard({ storageKey, front, children }: { storageKey: string; front: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(localStorage.getItem(storageKey) === "1"), [storageKey]);
  const flip = () => {
    localStorage.setItem(storageKey, "1");
    setOpen(true);
  };
  if (open) return <motion.div initial={reduce ? false : { rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.5 }}>{children}</motion.div>;
  return (
    <motion.button onClick={flip} whileTap={{ scale: 0.97 }} className="flex aspect-[3/4] w-full max-w-xs mx-auto flex-col items-center justify-center rounded-2xl border-2 border-[var(--mm-accent)] bg-[var(--mm-surface)] p-6 text-center">
      {front}
      <span className="mt-6 text-sm opacity-70">Toca para descubrir tu personaje</span>
    </motion.button>
  );
}

/** Sealed document that breaks on first tap. */
export function SealedDoc({ id, children, label }: { id: string; children: ReactNode; label: string }) {
  const reduce = useReducedMotion();
  const key = `mm-seal-${id}`;
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(localStorage.getItem(key) === "1"), [key]);
  if (open)
    return (
      <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-[var(--mm-accent)]/40 bg-[var(--mm-surface)] p-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-[var(--mm-accent)]">{label}</p>
        {children}
      </motion.div>
    );
  return (
    <button
      onClick={() => {
        localStorage.setItem(key, "1");
        setOpen(true);
      }}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--mm-accent)]/60 bg-[var(--mm-surface)] p-4 text-left"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mm-primary)] text-lg">✉</span>
      <span>
        <span className="block font-semibold">Documento sellado</span>
        <span className="text-sm opacity-70">{label} · toca para romper el sello</span>
      </span>
    </button>
  );
}
