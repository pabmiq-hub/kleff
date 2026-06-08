import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminSaveSection } from "@/lib/content.functions";
import { useEditor } from "@/editor/EditorProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { getSectionSchema, withDefaults } from "./schemas";
import { useSectionContent } from "./useSectionContent";

type SectionData = Record<string, unknown>;

interface SectionContextValue {
  sectionKey: string;
  data: SectionData;
  /** Update a single field on the section (debounced save). */
  setField: (path: string, value: unknown) => void;
  /** Append a new item to a list field, returns the index of the new item. */
  addItem: (listField: string) => number;
  /** Remove the item at index from a list field. */
  removeItem: (listField: string, index: number) => void;
  /** Move an item from one position to another. */
  moveItem: (listField: string, from: number, to: number) => void;
}

const SectionCtx = createContext<SectionContextValue | undefined>(undefined);

/**
 * Wraps a CMS-driven section. Provides:
 *  - merged content (DB stored on top of schema defaults), available via useSection()
 *  - editing helpers that persist to content_sections (super-admin only)
 *
 * The section is identified by `sectionKey` (e.g. "about.team", "how.activities").
 * The schema must be registered in src/cms/schemas.ts so default values exist.
 */
export function SectionProvider({
  sectionKey,
  children,
}: {
  sectionKey: string;
  children: ReactNode;
}) {
  const stored = useSectionContent(sectionKey); // already merged with defaults
  const [data, setData] = useState<SectionData>(stored);
  const { isSuperAdmin } = useEditor();
  const { locale } = useI18n();
  const save = useServerFn(adminSaveSection);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<SectionData | null>(null);

  // Re-sync local state only when the sectionKey changes (mount / route change).
  // After that, local state is the source of truth — otherwise optimistic edits
  // would be clobbered by a stale loader re-read.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setData(stored);
    pending.current = null;
  }, [sectionKey]);

  const persist = useCallback(
    (next: SectionData) => {
      if (!isSuperAdmin) return;
      pending.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const payload = pending.current;
        if (!payload) return;
        pending.current = null;
        try {
          await save({ data: { sectionKey, content: payload, schemaVersion: 1, locale } });
          if (locale === "es") {
            toast.success("Guardado. Traduciendo a CA y EN…", { duration: 2000 });
          } else {
            toast.success("Guardado");
          }
        } catch (e) {
          toast.error(`No se pudo guardar: ${(e as Error).message}`);
        }
      }, 500);
    },
    [isSuperAdmin, save, sectionKey, locale]
  );

  // Flush pending save on unmount so quick edits don't get lost
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const payload = pending.current;
      if (payload && isSuperAdmin) {
        // Fire-and-forget; we can't await in cleanup
        save({ data: { sectionKey, content: payload, schemaVersion: 1, locale } }).catch(() => undefined);
      }
    };
  }, [isSuperAdmin, save, sectionKey, locale]);

  const setField = useCallback(
    (path: string, value: unknown) => {
      setData((prev) => {
        const next = setByPath(prev, path, value);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addItem = useCallback(
    (listField: string) => {
      const schema = getSectionSchema(sectionKey);
      const fieldSchema = schema?.fields[listField];
      let idx = 0;
      setData((prev) => {
        const list = (Array.isArray(prev[listField]) ? prev[listField] : []) as unknown[];
        const empty = emptyItem(fieldSchema);
        const nextList = [...list, empty];
        idx = nextList.length - 1;
        const next = { ...prev, [listField]: nextList };
        persist(next);
        return next;
      });
      return idx;
    },
    [persist, sectionKey]
  );

  const removeItem = useCallback(
    (listField: string, index: number) => {
      setData((prev) => {
        const list = (Array.isArray(prev[listField]) ? prev[listField] : []) as unknown[];
        const nextList = list.filter((_, i) => i !== index);
        const next = { ...prev, [listField]: nextList };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const moveItem = useCallback(
    (listField: string, from: number, to: number) => {
      setData((prev) => {
        const list = (Array.isArray(prev[listField]) ? prev[listField] : []).slice() as unknown[];
        if (from < 0 || from >= list.length || to < 0 || to >= list.length) return prev;
        const [item] = list.splice(from, 1);
        list.splice(to, 0, item);
        const next = { ...prev, [listField]: list };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const value = useMemo<SectionContextValue>(
    () => ({ sectionKey, data, setField, addItem, removeItem, moveItem }),
    [sectionKey, data, setField, addItem, removeItem, moveItem]
  );

  return <SectionCtx.Provider value={value}>{children}</SectionCtx.Provider>;
}

export function useSection(): SectionContextValue {
  const ctx = useContext(SectionCtx);
  if (!ctx) throw new Error("useSection must be used inside <SectionProvider>");
  return ctx;
}

/**
 * Hook to access a single value from the current section by dotted path.
 * Falls back to the provided default.
 */
export function useSectionValue<T = string>(path: string, fallback: T): T {
  const { data } = useSection();
  const v = getByPath(data, path);
  if (v === undefined || v === null || v === "") return fallback;
  return v as T;
}

/* ---------------- helpers ---------------- */

export function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function setByPath(
  obj: SectionData,
  path: string,
  value: unknown
): SectionData {
  const parts = path.split(".");
  if (parts.length === 1) {
    return { ...obj, [parts[0]]: value };
  }
  const [head, ...rest] = parts;
  const child = obj[head];
  // Numeric index? -> child should be an array
  const nextRest = rest.join(".");
  if (/^\d+$/.test(rest[0])) {
    const arr = (Array.isArray(child) ? child.slice() : []) as unknown[];
    const idx = Number(rest[0]);
    const subPath = rest.slice(1).join(".");
    const item = (typeof arr[idx] === "object" && arr[idx] != null
      ? { ...(arr[idx] as Record<string, unknown>) }
      : {}) as SectionData;
    arr[idx] = subPath ? setByPath(item, subPath, value) : value;
    return { ...obj, [head]: arr };
  }
  const nested = (typeof child === "object" && child != null
    ? { ...(child as Record<string, unknown>) }
    : {}) as SectionData;
  return { ...obj, [head]: setByPath(nested, nextRest, value) };
}

function emptyItem(fieldSchema: unknown): Record<string, unknown> {
  // We have to guard against the schema being undefined
  if (!fieldSchema || typeof fieldSchema !== "object") return {};
  const f = fieldSchema as { kind?: string; fields?: Record<string, unknown> };
  if (f.kind !== "list" || !f.fields) return {};
  const out: Record<string, unknown> = {};
  for (const [k, sub] of Object.entries(f.fields)) {
    const s = sub as { kind?: string };
    if (s.kind === "list") out[k] = [];
    else out[k] = "";
  }
  return out;
}

/**
 * Helper — load a section's content via the loader using `withDefaults`.
 * Useful when a section schema needs defaults applied even when used outside
 * of <SectionProvider>.
 */
export function withSectionDefaults(sectionKey: string, stored: SectionData | null) {
  const schema = getSectionSchema(sectionKey);
  if (!schema) return stored ?? {};
  return withDefaults(schema, stored);
}
