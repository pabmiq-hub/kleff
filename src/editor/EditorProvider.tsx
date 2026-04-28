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
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  adminGetPageOverrides,
  adminSaveOverride,
  adminClearOverride,
  adminDiscardDrafts,
  adminPublishPage,
  getPublishedOverrides,
} from "@/server/overrides.functions";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { OverrideMap, StyleProps } from "./types";
import { buildOverrideMap } from "./types";

interface SelectedElement {
  id: string;
  kind: "text" | "image";
  rect: DOMRect;
}

interface EditorContextValue {
  // mode
  isSuperAdmin: boolean;
  editMode: boolean;
  toggleEditMode: () => void;

  // current page
  pagePath: string;

  // overrides
  overrides: OverrideMap;
  loading: boolean;
  hasDrafts: boolean;

  // selection
  selected: SelectedElement | null;
  setSelected: (s: SelectedElement | null) => void;

  // mutations
  setText: (elementId: string, text: string) => Promise<void>;
  setImage: (elementId: string, src: string, alt?: string) => Promise<void>;
  setStyle: (elementId: string, style: Partial<StyleProps>) => Promise<void>;
  setHidden: (elementId: string, hidden: boolean) => Promise<void>;
  clearProperty: (elementId: string, property: string) => Promise<void>;

  // page-level
  discardDrafts: () => Promise<void>;
  publish: () => Promise<void>;
  reload: () => Promise<void>;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const pagePath = useRouterState({
    select: (s) => {
      // Strip trailing slashes
      let p = s.location.pathname.replace(/\/+$/, "");
      if (p === "") p = "/";
      // Strip locale prefix so /about, /en/about and /ca/about share the same overrides.
      // Locales: es (default, no prefix), en, ca.
      const localeMatch = p.match(/^\/(en|ca)(\/.*)?$/);
      if (localeMatch) {
        p = localeMatch[2] ?? "/";
        if (p === "") p = "/";
      }
      return p;
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const [selected, setSelected] = useState<SelectedElement | null>(null);

  const getPublic = useServerFn(getPublishedOverrides);
  const getAll = useServerFn(adminGetPageOverrides);
  const save = useServerFn(adminSaveOverride);
  const clear = useServerFn(adminClearOverride);
  const discardFn = useServerFn(adminDiscardDrafts);
  const publishFn = useServerFn(adminPublishPage);

  const lastLoadedKey = useRef<string>("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const r = await getAll({ data: { pagePath } });
        setOverrides(buildOverrideMap(r.overrides));
        setHasDrafts(r.overrides.some((o) => o.status === "draft"));
      } else {
        const r = await getPublic({ data: { pagePath } });
        setOverrides(buildOverrideMap(r.overrides));
        setHasDrafts(false);
      }
    } catch (e) {
      console.error("Failed to load overrides", e);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, pagePath, getAll, getPublic]);

  // Reload when route or admin status changes
  useEffect(() => {
    const key = `${pagePath}|${isSuperAdmin ? "1" : "0"}`;
    if (lastLoadedKey.current === key) return;
    lastLoadedKey.current = key;
    void reload();
    setSelected(null);
  }, [pagePath, isSuperAdmin, reload]);

  // Disable edit mode for non-admins automatically
  useEffect(() => {
    if (!isSuperAdmin && editMode) setEditMode(false);
  }, [isSuperAdmin, editMode]);

  const toggleEditMode = useCallback(() => {
    if (!isSuperAdmin) return;
    setEditMode((v) => {
      if (v) setSelected(null);
      return !v;
    });
  }, [isSuperAdmin]);

  // Optimistic mutation helpers
  const applyLocal = useCallback(
    (elementId: string, property: string, value: unknown) => {
      setOverrides((prev) => {
        const next: OverrideMap = { ...prev };
        const cur = { ...(next[elementId] ?? {}) } as Record<string, unknown>;
        if (property === "style") {
          cur.style = { ...(cur.style as object), ...(value as object) };
        } else {
          cur[property] = value;
        }
        next[elementId] = cur as OverrideMap[string];
        return next;
      });
      setHasDrafts(true);
    },
    []
  );

  const persist = useCallback(
    async (elementId: string, property: string, value: unknown) => {
      try {
        await save({
          data: { pagePath, elementId, property, value: value as never },
        });
      } catch (e) {
        toast.error((e as Error).message);
        await reload();
      }
    },
    [save, pagePath, reload]
  );

  const setText = useCallback(
    async (elementId: string, text: string) => {
      applyLocal(elementId, "text", text);
      await persist(elementId, "text", text);
    },
    [applyLocal, persist]
  );

  const setImage = useCallback(
    async (elementId: string, src: string, alt?: string) => {
      applyLocal(elementId, "src", src);
      await persist(elementId, "src", src);
      if (alt !== undefined) {
        applyLocal(elementId, "alt", alt);
        await persist(elementId, "alt", alt);
      }
    },
    [applyLocal, persist]
  );

  const setStyle = useCallback(
    async (elementId: string, style: Partial<StyleProps>) => {
      // Merge with existing style and persist whole style object
      const current = (overrides[elementId]?.style ?? {}) as StyleProps;
      const merged = { ...current, ...style };
      // Strip undefined / empty values
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(merged)) {
        if (v !== undefined && v !== "" && v !== null) clean[k] = v;
      }
      applyLocal(elementId, "style", clean);
      await persist(elementId, "style", clean);
    },
    [overrides, applyLocal, persist]
  );

  const setHidden = useCallback(
    async (elementId: string, hidden: boolean) => {
      applyLocal(elementId, "hidden", hidden);
      await persist(elementId, "hidden", hidden);
    },
    [applyLocal, persist]
  );

  const clearProperty = useCallback(
    async (elementId: string, property: string) => {
      setOverrides((prev) => {
        const next = { ...prev };
        const cur = { ...(next[elementId] ?? {}) } as Record<string, unknown>;
        delete cur[property];
        next[elementId] = cur as OverrideMap[string];
        return next;
      });
      try {
        await clear({ data: { pagePath, elementId, property } });
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [clear, pagePath]
  );

  const discardDrafts = useCallback(async () => {
    try {
      await discardFn({ data: { pagePath } });
      toast.success("Borradores descartados");
      setSelected(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [discardFn, pagePath, reload]);

  const publish = useCallback(async () => {
    try {
      const r = await publishFn({ data: { pagePath } });
      toast.success(`Publicados ${r.published} cambios`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [publishFn, pagePath, reload]);

  // URL hint to auto-open edit mode for super admins (e.g. ?edit=1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSuperAdmin) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("edit") === "1") setEditMode(true);
  }, [isSuperAdmin, pagePath]);

  const value = useMemo<EditorContextValue>(
    () => ({
      isSuperAdmin,
      editMode,
      toggleEditMode,
      pagePath,
      overrides,
      loading,
      hasDrafts,
      selected,
      setSelected,
      setText,
      setImage,
      setStyle,
      setHidden,
      clearProperty,
      discardDrafts,
      publish,
      reload,
    }),
    [
      isSuperAdmin,
      editMode,
      toggleEditMode,
      pagePath,
      overrides,
      loading,
      hasDrafts,
      selected,
      setText,
      setImage,
      setStyle,
      setHidden,
      clearProperty,
      discardDrafts,
      publish,
      reload,
    ]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
