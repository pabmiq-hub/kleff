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
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadRoles = async (userId: string | undefined) => {
    if (!userId) {
      setIsSuperAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setIsSuperAdmin((data ?? []).some((r) => r.role === "super_admin"));
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
    // Subscribe FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Defer role loading to avoid recursive auth calls
      if (newSession?.user) {
        setTimeout(() => {
          void loadRoles(newSession.user.id);
        }, 0);
      } else {
        setIsSuperAdmin(false);
      }
    });

    // Then check existing session
    void supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      if (existing?.user) {
        void loadRoles(existing.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshRoles = async () => {
    await loadRoles(session?.user?.id);
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
        loading,
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
