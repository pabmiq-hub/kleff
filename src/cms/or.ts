/** Returns `value` if it's a non-empty string, otherwise `fallback`. */
export function or(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
