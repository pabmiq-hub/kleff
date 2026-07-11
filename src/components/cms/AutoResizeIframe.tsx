import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type Props = {
  src: string;
  title: string;
  className?: string;
  /** Initial / fallback height in px when the embedded form doesn't announce its size. */
  fallbackHeight?: number;
  /** Absolute max the iframe can auto-grow to. */
  maxHeight?: number;
};

/**
 * Iframe that tries to auto-resize to its content height across origins.
 *
 * Strategy (in priority order):
 *   1. Listen for postMessage size events from common form providers
 *      (Jotform, Tally, Typeform, iframe-resizer, generic { height }).
 *   2. On every iframe `load` event (fires when the inner document navigates,
 *      even cross-origin, e.g. multi-step forms moving to step 2), if no
 *      explicit height was received, grow the iframe by `growthFactor` up to
 *      `maxHeight`. This prevents step 2 of a multi-step form from being cut
 *      off on platforms that don't emit resize messages.
 *   3. As a last resort, `scrolling="auto"` allows inner scroll (poor UX on
 *      touch devices) and we render an "open in new tab" escape link below
 *      the iframe.
 */
export function AutoResizeIframe({
  src,
  title,
  className,
  fallbackHeight = 3200,
  maxHeight = 20000,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const receivedMessageRef = useRef(false);
  const loadCountRef = useRef(0);
  const [height, setHeight] = useState<number>(fallbackHeight);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const applyHeight = (h: number) => {
      if (!Number.isFinite(h) || h <= 0) return;
      const next = Math.min(Math.max(Math.round(h), 200), maxHeight);
      setHeight((prev) => (Math.abs(prev - next) < 4 ? prev : next));
    };

    const extractHeight = (data: unknown): number | null => {
      if (typeof data === "number") return data;
      if (typeof data === "string") {
        const m = /setHeight:(\d+)/i.exec(data);
        if (m) return Number(m[1]);
        try { return extractHeight(JSON.parse(data)); } catch { return null; }
      }
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (d.type === "tally-embed" && d.payload && typeof (d.payload as Record<string, unknown>).height === "number") {
          return (d.payload as { height: number }).height;
        }
        if (typeof d.height === "number") return d.height;
        if (typeof d.height === "string" && /^\d+/.test(d.height)) return Number(d.height);
        if (typeof d.iframeHeight === "number") return d.iframeHeight;
      }
      return null;
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const h = extractHeight(event.data);
      if (h != null) {
        receivedMessageRef.current = true;
        applyHeight(h);
      }
    };

    const onLoad = () => {
      loadCountRef.current += 1;
      // On second+ load (navigation inside the iframe, e.g. step 2 of a
      // multi-step form), if the embed doesn't announce its size via
      // postMessage, grow the iframe so the new step isn't clipped.
      if (loadCountRef.current >= 2 && !receivedMessageRef.current) {
        setHeight((prev) => Math.min(Math.round(prev * 1.6), maxHeight));
      }
    };

    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", onLoad);
    };
  }, [maxHeight, src]);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className={className}
        style={{ height: `${height}px`, width: "100%", border: 0, display: "block" }}
        scrolling="auto"
      />
      <div className="mt-2 flex items-center justify-end">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ¿Se ve cortado? Abrir formulario en una pestaña nueva <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
