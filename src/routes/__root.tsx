import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import { EditorProvider } from "@/editor/EditorProvider";
import { EditorOverlay } from "@/editor/EditorOverlay";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/site/CookieConsent";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KLEFF — Comunidad de juegos de mesa en Barcelona" },
      {
        name: "description",
        content:
          "La comunidad de juegos de mesa más grande de Europa. Game Nights cada semana en Barcelona. Más de 300 juegos, ambiente inclusivo y multilingüe.",
      },
      { name: "author", content: "KLEFF" },
      { name: "theme-color", content: "#e87a64" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "KLEFF" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@kleff.bcn" },
      { property: "og:title", content: "KLEFF — Comunidad de juegos de mesa en Barcelona" },
      { name: "twitter:title", content: "KLEFF — Comunidad de juegos de mesa en Barcelona" },
      { name: "description", content: "Comunidad de aficionados a los juegos de mesa en Barcelona. Ven sólo o acompañado para disfrutar de las mejores noches de juegos." },
      { property: "og:description", content: "Comunidad de aficionados a los juegos de mesa en Barcelona. Ven sólo o acompañado para disfrutar de las mejores noches de juegos." },
      { name: "twitter:description", content: "Comunidad de aficionados a los juegos de mesa en Barcelona. Ven sólo o acompañado para disfrutar de las mejores noches de juegos." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/bAnIbqAHB3bI0vZgvtW7HqSDclV2/social-images/social-1777293925502-board-games-juegos-de-mesa-kleff-barcelona.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/bAnIbqAHB3bI0vZgvtW7HqSDclV2/social-images/social-1777293925502-board-games-juegos-de-mesa-kleff-barcelona.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "preconnect",
        href: "https://cf.geekdo-images.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "preconnect",
        href: "https://gyecpblbaovmprdvgmct.supabase.co",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <I18nProvider>
        <EditorProvider>
          <EditorLayoutShift>
            <Outlet />
          </EditorLayoutShift>
          <EditorOverlay />
          <CookieConsent />
          <Toaster />
        </EditorProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

import { useEditor } from "@/editor/EditorProvider";
import { useRouterState } from "@tanstack/react-router";
function EditorLayoutShift({ children }: { children: React.ReactNode }) {
  const { editMode, isSuperAdmin } = useEditor();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/app") || pathname.startsWith("/login");
  const active = editMode && isSuperAdmin && !isAdminArea;
  return (
    <div
      style={{
        paddingRight: active ? 360 : 0,
        paddingTop: active ? 48 : 0,
        transition: "padding 200ms ease",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
