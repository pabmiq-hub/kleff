// @ts-nocheck
// Ported from the original Konektum shared helpers.
/**
 * Bilateral dating compatibility (shared by edge functions).
 * Both people must accept each other's gender according to their
 * "dating preference" answer. "Open to all" only works if the other
 * person is explicitly looking for that gender (or is also open).
 */
export function areDatingCompatible(
  pref1: string | null | undefined,
  gender1: string | null | undefined,
  pref2: string | null | undefined,
  gender2: string | null | undefined,
): boolean {
  // Unknown orientation (e.g. anonymous participants or legacy registrations)
  // must NOT block romance: we cannot prove incompatibility, so we allow it.
  if (!pref1 || !pref2) return true;

  const openPrefs = ["abierto a todo", "abierta a todo", "abierto/a a todo", "open to all"];
  const p1Lower = pref1.toLowerCase();
  const p2Lower = pref2.toLowerCase();
  const p1IsOpen = openPrefs.some((o) => p1Lower.includes(o));
  const p2IsOpen = openPrefs.some((o) => p2Lower.includes(o));

  const p1LookingForWoman = p1Lower.includes("busco una mujer") || p1Lower.includes("looking for a woman");
  const p1LookingForMan = p1Lower.includes("busco un hombre") || p1Lower.includes("looking for a man");
  const p2LookingForWoman = p2Lower.includes("busco una mujer") || p2Lower.includes("looking for a woman");
  const p2LookingForMan = p2Lower.includes("busco un hombre") || p2Lower.includes("looking for a man");

  const g1 = (gender1 || "").toLowerCase();
  const g2 = (gender2 || "").toLowerCase();
  const p1IsMan = g1 === "hombre" || g1 === "man" || p1Lower.includes("soy un hombre");
  const p1IsWoman = g1 === "mujer" || g1 === "woman" || p1Lower.includes("soy una mujer");
  const p2IsMan = g2 === "hombre" || g2 === "man" || p2Lower.includes("soy un hombre");
  const p2IsWoman = g2 === "mujer" || g2 === "woman" || p2Lower.includes("soy una mujer");

  if (p1IsOpen && p2IsOpen) return true;
  if (p1IsOpen) {
    if (p1IsMan && p2LookingForMan) return true;
    if (p1IsWoman && p2LookingForWoman) return true;
    return false;
  }
  if (p2IsOpen) {
    if (p2IsMan && p1LookingForMan) return true;
    if (p2IsWoman && p1LookingForWoman) return true;
    return false;
  }

  if (p1IsMan && p1LookingForWoman && p2IsWoman && p2LookingForMan) return true;
  if (p1IsWoman && p1LookingForMan && p2IsMan && p2LookingForWoman) return true;
  if (p1IsMan && p1LookingForMan && p2IsMan && p2LookingForMan) return true;
  if (p1IsWoman && p1LookingForWoman && p2IsWoman && p2LookingForWoman) return true;

  return false;
}
