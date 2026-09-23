/**
 * Client-side image optimisation.
 *
 * Every image the admins/members upload is resized and re-encoded to WebP in
 * the browser *before* it travels to the server. A 6 MB phone photo typically
 * becomes a 150-300 KB WebP, which is the single biggest win for load speed
 * (nothing beats not shipping the bytes at all).
 *
 * The encoder loops: it lowers quality and, if still needed, the pixel
 * dimensions, until the result fits under `maxBytes` (1 MB by default) while
 * always preserving the original aspect ratio (no crop, no stretch).
 *
 * Falls back gracefully: if the browser can't decode/encode (SVG, GIF, exotic
 * formats, or no canvas), the original file is returned untouched.
 */

export type OptimizeOptions = {
  /** Longest side in pixels. Default 1600. */
  maxSize?: number;
  /** Starting WebP quality 0-1. Default 0.85. */
  quality?: number;
  /** Target maximum output size in bytes. Default 1 MB. */
  maxBytes?: number;
};

export type OptimizedImage = {
  file: File;
  fileName: string;
  contentType: string;
};

const PASSTHROUGH = /^image\/(svg\+xml|gif)$/i;

/** Formats a canvas can decode & re-encode. */
export function isOptimizableImage(file: File): boolean {
  return file.type.startsWith("image/") && !PASSTHROUGH.test(file.type);
}

/** Anything the app accepts as an image at all. */
export function isSupportedImage(file: File): boolean {
  return file.type.startsWith("image/");
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    // `imageOrientation: "from-image"` honours the EXIF rotation flag, so
    // portrait phone photos don't come out sideways after re-encoding.
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bmp = await createImageBitmap(file);
    }
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

type Encoded = { blob: Blob; ext: string; type: string };

async function encode(
  bmp: Awaited<ReturnType<typeof loadBitmap>>,
  longestSide: number,
  quality: number,
): Promise<Encoded | null> {
  const scale = Math.min(1, longestSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  bmp.draw(ctx, w, h);

  let blob = await canvasToBlob(canvas, "image/webp", quality);
  if (blob && blob.type === "image/webp") return { blob, ext: "webp", type: "image/webp" };

  blob = await canvasToBlob(canvas, "image/jpeg", quality);
  if (!blob) return null;
  return { blob, ext: "jpg", type: "image/jpeg" };
}

export async function optimizeImage(file: File, opts: OptimizeOptions = {}): Promise<OptimizedImage> {
  const maxSize = opts.maxSize ?? 1600;
  const startQuality = opts.quality ?? 0.85;
  const maxBytes = opts.maxBytes ?? 1024 * 1024;

  const fallback: OptimizedImage = {
    file,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
  };

  if (typeof document === "undefined") return fallback;
  if (!isOptimizableImage(file)) return fallback;

  let bmp: Awaited<ReturnType<typeof loadBitmap>> | null = null;
  try {
    bmp = await loadBitmap(file);
    const longest = Math.max(bmp.width, bmp.height);

    // Already small enough and within the size budget → don't touch it.
    if (file.size <= maxBytes && longest <= maxSize && /^image\/(webp|jpeg)$/i.test(file.type)) {
      return fallback;
    }

    const qualitySteps = [startQuality, 0.75, 0.65, 0.55, 0.45];
    const sizeSteps = [maxSize, Math.round(maxSize * 0.75), Math.round(maxSize * 0.56), Math.round(maxSize * 0.4)];

    let best: Encoded | null = null;
    outer: for (const side of sizeSteps) {
      for (const q of qualitySteps) {
        const out = await encode(bmp, side, q);
        if (!out) continue;
        if (!best || out.blob.size < best.blob.size) best = out;
        if (out.blob.size <= maxBytes) {
          best = out;
          break outer;
        }
      }
    }

    if (!best) return fallback;
    // Never make things worse (e.g. an already tiny optimised PNG/WebP).
    if (best.blob.size >= file.size && longest <= maxSize) return fallback;

    const fileName = renameTo(file.name, best.ext);
    return {
      file: new File([best.blob], fileName, { type: best.type }),
      fileName,
      contentType: best.type,
    };
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
