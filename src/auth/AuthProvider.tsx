import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadRoles = async (userId: string | undefined) => {
    if (!userId) {
      setIsSuperAdmin(false);
      return;
    }
    try {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      setIsSuperAdmin((data ?? []).some((r) => r.role === "super_admin"));
    } catch {
      setIsSuperAdmin(false);
    }
  };

  // Install a fetch interceptor that injects the Supabase access token
  // into same-origin /_serverFn/ requests so server functions using
  // requireSupabaseAuth receive the user's Bearer token.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as typeof window & { __serverFnFetchPatched?: boolean };
    if (w.__serverFnFetchPatched) return;
    w.__serverFnFetchPatched = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input instanceof Request
                ? input.url
                : "";
        const isServerFn = url.includes("/_serverFn/");
        if (isServerFn) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) {
            const headers = new Headers(
              init?.headers ?? (input instanceof Request ? input.headers : undefined),
            );
            if (!headers.has("authorization")) {
              headers.set("authorization", `Bearer ${token}`);
            }
            return originalFetch(input, { ...init, headers });
          }
        }
      } catch {
        // fall through to original fetch
      }
      return originalFetch(input, init);
    };
  }, []);

  useEffect(() => {
    let currentUserId: string | undefined;

    // Subscribe FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const newUserId = newSession?.user?.id;
      // Defer role loading to avoid recursive auth calls
      if (newSession?.user) {
        // Only block rendering while roles resolve when the user identity
        // actually changed (login/logout/switch). Token refreshes keep the
        // same userId and must not unmount authed routes.
        if (newUserId !== currentUserId) {
          setAuthReady(false);
        }
        currentUserId = newUserId;
        setRolesLoading(true);
        setTimeout(() => {
          void loadRoles(newSession.user.id).finally(() => {
            setRolesLoading(false);
            setAuthReady(true);
          });
        }, 0);
      } else {
        currentUserId = undefined;
        setIsSuperAdmin(false);
        setRolesLoading(false);
        setAuthReady(true);
      }
    });

    // Then check existing session
    void supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        currentUserId = existing.user.id;
        setRolesLoading(true);
        await loadRoles(existing.user.id).finally(() => setRolesLoading(false));
      } else {
        setIsSuperAdmin(false);
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);


  const refreshRoles = async () => {
    setRolesLoading(true);
    await loadRoles(session?.user?.id).finally(() => setRolesLoading(false));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        // Only expose `loading` for the initial auth bootstrap. Subsequent
        // token refreshes (e.g. when the browser tab regains focus) also
        // toggle `rolesLoading`, and if that bubbled up here the admin
        // layout would unmount `<Outlet />` and wipe the blog editor's
        // in-memory state on every tab switch.
        loading: !authReady,
        isSuperAdmin,
        refreshRoles,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
