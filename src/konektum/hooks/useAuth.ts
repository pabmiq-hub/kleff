// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/konektum/supabase";

/**
 * Delegated KLEFF users (permission "konektum") act on behalf of the club
 * organizer: Konektum filters everything by organizer user id, so we expose
 * the organizer's id as `user.id` and keep the real one in `user.realId`.
 */
const effectiveCache = new Map<string, Promise<string | null>>();
function resolveEffectiveId(realId: string): Promise<string | null> {
  if (!effectiveCache.has(realId)) {
    effectiveCache.set(realId, (async () => {
      const { data: own } = await supabase.from("organizers").select("user_id").eq("user_id", realId).maybeSingle();
      if (own) return null;
      const { data: allowed } = await supabase.rpc("tiene_permiso", { _user_id: realId, _recurso: "konektum", _recurso_id: null });
      if (allowed !== true) return null;
      const { data: club } = await supabase
        .from("organizers")
        .select("user_id")
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return club?.user_id && club.user_id !== realId ? club.user_id : null;
    })().catch(() => { effectiveCache.delete(realId); return null; }));
  }
  return effectiveCache.get(realId)!;
}

export function useAuth() {
  const raw = useRawAuth();
  const [effId, setEffId] = useState<string | null | undefined>(undefined);
  const realId = raw.user?.id ?? null;
  useEffect(() => {
    if (!realId) { setEffId(null); return; }
    let alive = true;
    setEffId(undefined);
    resolveEffectiveId(realId).then((id) => { if (alive) setEffId(id); });
    return () => { alive = false; };
  }, [realId]);
  const user = useMemo(() => {
    if (!raw.user) return null;
    if (!effId) return raw.user;
    return { ...raw.user, id: effId, realId: raw.user.id };
  }, [raw.user, effId]);
  const loading = raw.loading || (!!realId && effId === undefined);
  return { ...raw, user, loading };
}

function useRawAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialLoadDone = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        // Keep the same user object reference when the identity did not change
        // (token refresh on tab focus) so dependent effects don't reload and
        // remount the admin screens.
        setUser((prev) => {
          const next = session?.user ?? null;
          if (prev && next && prev.id === next.id) return prev;
          return next;
        });
        // Only set loading false for subsequent auth changes, not initial load
        if (initialLoadDone) {
          // Auth state changed after initial load - no need to update loading
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      initialLoadDone = true;
      setLoading(false); // Only set loading false here
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/admin/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
