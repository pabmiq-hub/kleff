// @ts-nocheck
/** Shared helpers to visually highlight missing/invalid form fields. */

/** Classes applied to an input/trigger when its field is invalid. */
export const errorInputClass =
  "border-destructive ring-2 ring-destructive/30 focus-visible:ring-destructive";

/** Classes applied to a field wrapper (group of label + control) when invalid. */
export const errorWrapperClass =
  "rounded-lg border border-destructive/50 bg-destructive/5 p-3 -mx-1";

export const fieldErrorMessage = (lang: "es" | "en") =>
  lang === "en" ? "This field is required" : "Este campo es obligatorio";

/** Scrolls to the first element flagged with [data-field-error="true"]. */
export const scrollToFirstError = () => {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[data-field-error="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = el.querySelector<HTMLElement>(
      "input, textarea, select, button[role='combobox']"
    );
    focusable?.focus({ preventScroll: true });
  });
};
