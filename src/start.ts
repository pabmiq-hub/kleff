import "@/integrations/supabase/env-override";
import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { supabase } from "@/integrations/supabase/client";

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
