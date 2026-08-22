const PUBLIC_STORAGE_MARKER = "/storage/v1/object/public/";
const RENDER_STORAGE_MARKER = "/storage/v1/render/image/public/";
const UNSUPPORTED_TRANSFORM = /\.(?:svg|gif)(?:$|[?#])/i;

type ImageTransformOptions = {
  width: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

/** Return a CDN-resized WebP URL for public Lovable Cloud Storage images. */
export function getOptimizedImageUrl(
  source: string | null | undefined,
  { width, height, quality = 76, resize = "cover" }: ImageTransformOptions,
): string {
  if (!source || UNSUPPORTED_TRANSFORM.test(source)) return source ?? "";

  let url: URL;
  try {
    url = new URL(source, "https://kleff.es");
  } catch {
    return source;
  }

  if (!url.pathname.includes(PUBLIC_STORAGE_MARKER) && !url.pathname.includes(RENDER_STORAGE_MARKER)) {
    return source;
  }

  url.pathname = url.pathname.replace(PUBLIC_STORAGE_MARKER, RENDER_STORAGE_MARKER);
  url.searchParams.set("width", String(Math.max(1, Math.round(width))));
  if (height) url.searchParams.set("height", String(Math.max(1, Math.round(height))));
  url.searchParams.set("resize", resize);
  url.searchParams.set("quality", String(quality));
  return url.toString();
}

export function getResponsiveImageSrcSet(
  source: string | null | undefined,
  widths: readonly number[],
  options: Omit<ImageTransformOptions, "width"> = {},
): string | undefined {
  if (!source || UNSUPPORTED_TRANSFORM.test(source) || !source.includes("/storage/v1/")) return undefined;
  return widths
    .map((width) => `${getOptimizedImageUrl(source, { ...options, width })} ${width}w`)
    .join(", ");
}

/** Rewrite images in CMS HTML so article bodies never download full originals. */
export function optimizeHtmlImageSources(html: string, width = 1280): string {
  return html.replace(/(<img\b[^>]*?\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, before, source, after) => {
    const optimized = getOptimizedImageUrl(source, { width, quality: 78, resize: "contain" });
    if (optimized === source) return match;
    const loading = /\bloading=/.test(after) ? "" : ' loading="lazy"';
    const decoding = /\bdecoding=/.test(after) ? "" : ' decoding="async"';
    return `${before}${optimized}${after.replace(/>$/, `${loading}${decoding}>`)}`;
  });
}