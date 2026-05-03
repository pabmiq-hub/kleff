import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { lookupRedirect } from "@/server/redirects.functions";

/**
 * Catch-all 404 / redirect handler. If the requested path matches a row in
 * `content_redirects`, we throw a redirect (which is sent as a 30x by the
 * SSR runtime). Otherwise we render a friendly 404.
 */
export const Route = createFileRoute("/$")({
  loader: async ({ params, location }) => {
    const path = location.pathname;
    const { to } = await lookupRedirect({ data: { path } });
    if (to) {
      throw redirect({ href: to, statusCode: 301, reloadDocument: true });
    }
    return { path, splat: params._splat };
  },
  head: () => ({
    meta: [
      { title: "Página no encontrada — KLEFF" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFound,
});

function NotFound() {
  const { path } = Route.useLoaderData();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No hemos encontrado <code className="font-mono">{path}</code>.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
