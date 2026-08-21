/**
 * Client-side image optimisation.
 *
 * Every image the admins/members upload is resized and re-encoded to WebP in
 * the browser *before* it travels to the server. A 6 MB phone photo typically
 * becomes a 150-300 KB WebP, which is the single biggest win for load speed
 * (nothing beats not shipping the bytes at all).
 *
 * Falls back gracefully: if the browser can't decode/encode (SVG, GIF, exotic
 * formats, or no canvas), the original file is returned untouched.
 */

export type OptimizeOptions = {
  /** Longest side in pixels. Default 1920 (enough for full-bleed hero images). */
  maxSize?: number;
  /** WebP quality 0-1. Default 0.82 — visually lossless for photos. */
  quality?: number;
};

export type OptimizedImage = {
  file: File;
  fileName: string;
  contentType: string;
};

const PASSTHROUGH = /^image\/(svg\+xml|gif)$/i;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      close: () => bmp.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode error"));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function renameTo(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizedImage> {
  const maxSize = opts.maxSize ?? 1920;
  const quality = opts.quality ?? 0.82;
  const fallback: OptimizedImage = {
    file,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
  };

  if (typeof document === "undefined") return fallback;
  if (!file.type.startsWith("image/") || PASSTHROUGH.test(file.type)) return fallback;

  let bmp: Awaited<ReturnType<typeof loadBitmap>> | null = null;
  try {
    bmp = await loadBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    ctx.imageSmoothingQuality = "high";
    bmp.draw(ctx, w, h);

    let blob = await canvasToBlob(canvas, "image/webp", quality);
    let ext = "webp";
    let type = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
      ext = "jpg";
      type = "image/jpeg";
    }
    if (!blob) return fallback;
    // Never make things worse (e.g. an already tiny optimised PNG/WebP).
    if (blob.size >= file.size && scale === 1) return fallback;

    const fileName = renameTo(file.name, ext);
    return { file: new File([blob], fileName, { type }), fileName, contentType: type };
  } catch {
    return fallback;
  } finally {
    bmp?.close?.();
  }
}

/** Optimise and return the payload our `uploadMedia` server function expects. */
export async function optimizeToUploadPayload(
  file: File,
  opts?: OptimizeOptions,
): Promise<{ fileName: string; contentType: string; base64: string }> {
  const { file: out, fileName, contentType } = await optimizeImage(file, opts);
  const buf = await out.arrayBuffer();
  const { arrayBufferToBase64 } = await import("@/lib/base64");
  return { fileName, contentType, base64: arrayBufferToBase64(buf) };
}
