import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function dispatch(fn: string, request: Request): Promise<Response> {
  const { runKonFunction } = await import("@/lib/kon-fn/registry.server");
  try {
    return withCors(await runKonFunction(fn, request));
  } catch (err) {
    console.error(`[kon-fn:${fn}]`, err);
    return withCors(
      new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}

export const Route = createFileRoute("/api/public/kon/$fn")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request, params }) => dispatch(params.fn, request),
      POST: async ({ request, params }) => dispatch(params.fn, request),
    },
  },
});
