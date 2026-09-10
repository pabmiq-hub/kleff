import { applySupabaseEnvOverride } from "@/integrations/supabase/env-override";
import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { supabase } from "@/integrations/supabase/client";

// On the production Worker the environment is re-bound on every request, so
// the APP_SUPABASE_* override must be re-applied before any handler runs.
const supabaseEnvMiddleware = createMiddleware({ type: "request" }).server(
  ({ next }) => {
    applySupabaseEnvOverride();
    return next();
  },
);

const authenticatedServerFetch: typeof fetch = async (input, init) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
};

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  serverFns: {
    fetch: authenticatedServerFetch,
  },
}));
