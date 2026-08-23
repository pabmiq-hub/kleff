import { createFileRoute } from "@tanstack/react-router";

const LUDOYA_IMAGE_HOST = "ludoya-images.s3.eu-west-par.io.cloud.ovh.net";
const ALLOWED_PATH = /^\/(?:games|game-versions|assets)\/[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/i;

function imageContentType(pathname: string): string {
  if (/\.png$/i.test(pathname)) return "image/png";
  if (/\.webp$/i.test(pathname)) return "image/webp";
  return "image/jpeg";
}

export const Route = createFileRoute("/api/public/ludoya-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requested = new URL(request.url).searchParams.get("url");
        if (!requested) return new Response("Missing image URL", { status: 400 });

        let source: URL;
        try {
          source = new URL(requested);
        } catch {
          return new Response("Invalid image URL", { status: 400 });
        }

        if (
          source.protocol !== "https:" ||
          source.hostname !== LUDOYA_IMAGE_HOST ||
          source.port !== "" ||
          !ALLOWED_PATH.test(source.pathname)
        ) {
          return new Response("Image source not allowed", { status: 403 });
        }

        try {
          const upstream = await fetch(source.toString(), {
            headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" },
          });
          if (!upstream.ok || !upstream.body) {
            return new Response("Image unavailable", {
              status: upstream.status === 404 ? 404 : 502,
              headers: { "Cache-Control": "public, max-age=300" },
            });
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": imageContentType(source.pathname),
              "Cache-Control": "public, max-age=31536000, immutable",
              "Cross-Origin-Resource-Policy": "same-origin",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          return new Response("Image unavailable", {
            status: 502,
            headers: { "Cache-Control": "public, max-age=300" },
          });
        }
      },
    },
  },
});