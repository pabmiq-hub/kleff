import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  title: string;
  className?: string;
  /** Initial / fallback height in px when the embedded form doesn't announce its size. */
  fallbackHeight?: number;
};

/**
 * Iframe that tries to auto-resize to its content height across origins.
 *
 * Cross-origin iframes cannot be measured from the parent, so we rely on
 * postMessage protocols the common form providers already use:
 *   - Jotform: string "setHeight:<px>:<formId>"
 *   - Tally:   { type: "tally-embed", event: "resize", payload: { height } }
 *   - Typeform embed: { type: "form-ready" | "form-screen-changed", height }
 *   - Google Forms & static pages: don't emit anything → fallback height
 *   - Generic iframe-resizer / custom: { type: "resize" | "iframeHeight", height }
 *     or a plain number.
 *
 * We also poll a few times after load to catch late layout shifts inside the
 * form (e.g. multi-step forms that grow the DOM).
 */
export function AutoResizeIframe({ src, title, className, fallbackHeight = 2400 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(fallbackHeight);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const applyHeight = (h: number) => {
      if (!Number.isFinite(h) || h <= 0) return;
      // Clamp to a sane range so a malformed message can't blow up the page.
      const next = Math.min(Math.max(Math.round(h), 200), 20000);
      setHeight((prev) => (Math.abs(prev - next) < 4 ? prev : next));
    };

    const extractHeight = (data: unknown): number | null => {
      if (typeof data === "number") return data;
      if (typeof data === "string") {
        // Jotform: "setHeight:1234:xxxx"
        const m = /setHeight:(\d+)/i.exec(data);
        if (m) return Number(m[1]);
        // Some providers stringify JSON
        try { return extractHeight(JSON.parse(data)); } catch { return null; }
      }
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        // Tally
        if (d.type === "tally-embed" && d.payload && typeof (d.payload as Record<string, unknown>).height === "number") {
          return (d.payload as { height: number }).height;
        }
        // Typeform, generic
        if (typeof d.height === "number") return d.height;
        if (typeof d.height === "string" && /^\d+/.test(d.height)) return Number(d.height);
        // iframe-resizer messages
        if (typeof d.iframeHeight === "number") return d.iframeHeight;
      }
      return null;
    };

    const onMessage = (event: MessageEvent) => {
      // Only trust messages coming from this iframe's window.
      if (event.source !== iframe.contentWindow) return;
      const h = extractHeight(event.data);
      if (h != null) applyHeight(h);
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className={className}
      style={{ height: `${height}px`, width: "100%", border: 0, display: "block" }}
      // Allow inner scroll as a last-resort fallback when the embed doesn't announce size.
      scrolling="auto"
    />
  );
}
