import { useEffect, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

function ensureScript(): void {
  if (typeof document === "undefined") return;
  if (window.instgrm) {
    window.instgrm.Embeds.process();
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  );
  if (existing) {
    existing.addEventListener("load", () => window.instgrm?.Embeds.process(), {
      once: true,
    });
    return;
  }
  const s = document.createElement("script");
  s.src = SCRIPT_SRC;
  s.async = true;
  s.defer = true;
  document.body.appendChild(s);
}

/**
 * Native Instagram embed. Accepts a permalink URL to any post/reel and renders
 * the official embed (plays inline). Loads instagram embed.js lazily once.
 */
export function InstagramEmbed({
  url,
  caption,
  className = "",
  bare = false,
}: {
  url: string;
  caption?: boolean;
  className?: string;
  bare?: boolean;
}) {
  const ref = useRef<HTMLQuoteElement | null>(null);

  useEffect(() => {
    ensureScript();
    const id = window.setTimeout(() => window.instgrm?.Embeds.process(), 300);
    return () => window.clearTimeout(id);
  }, [url]);

  const framedStyle: React.CSSProperties = {
    background: "#FFF",
    border: 0,
    borderRadius: 16,
    boxShadow: "0 0 1px rgba(0,0,0,0.5),0 1px 10px rgba(0,0,0,0.15)",
    margin: "0 auto",
    maxWidth: 540,
    minWidth: 280,
    padding: 0,
    width: "100%",
  };
  const bareStyle: React.CSSProperties = {
    background: "transparent",
    border: 0,
    boxShadow: "none",
    margin: "0 auto",
    maxWidth: 540,
    minWidth: 280,
    padding: 0,
    width: "100%",
  };

  return (
    <blockquote
      ref={ref}
      className={`instagram-media ${className}`}
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      data-instgrm-captioned={caption ? "" : undefined}
      style={bare ? bareStyle : framedStyle}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", padding: 16, textDecoration: "none" }}
      >
        Ver esta publicación en Instagram
      </a>
    </blockquote>
  );
}

