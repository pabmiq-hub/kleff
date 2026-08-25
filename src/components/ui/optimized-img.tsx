import type { ImgHTMLAttributes } from "react";
import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/lib/image-delivery";

const DEFAULT_RESPONSIVE_WIDTHS = [480, 768, 1080, 1600, 2000];

type OptimizedImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string | null | undefined;
  alt: string;
  /** Intrinsic width in px. Also used as the base for the default srcSet. */
  width?: number;
  height?: number;
  /** Custom breakpoints for srcSet. Defaults to a general-purpose set. */
  widths?: number[];
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

/**
 * Drop-in replacement for a plain `<img>` for any image that comes from
 * Supabase Storage (member photos, page galleries, admin thumbnails, etc.)
 * but isn't wired into the CMS editor (`EditableImage`).
 *
 * Rewrites the request through Supabase's on-the-fly image transform, so it
 * works retroactively on images already in storage — nothing needs to be
 * re-uploaded. Non-storage sources (bundled assets, external CDNs) pass
 * through untouched.
 */
export function OptimizedImg({
  src,
  alt,
  width,
  height,
  widths,
  quality,
  resize = "cover",
  loading = "lazy",
  decoding = "async",
  sizes,
  ...rest
}: OptimizedImgProps) {
  const targetWidth = width ?? 1600;
  const responsiveWidths = widths ?? DEFAULT_RESPONSIVE_WIDTHS;
  const displaySrc = getOptimizedImageUrl(src, { width: targetWidth, height, quality, resize });
  // When an explicit height is given, keep the same aspect ratio across breakpoints,
  // otherwise the transform service returns stretched variants.
  const srcSet =
    height && width
      ? responsiveWidths
          .map(
            (w) =>
              `${getOptimizedImageUrl(src, { width: w, height: Math.round((height / width) * w), quality, resize })} ${w}w`,
          )
          .join(", ")
      : getResponsiveImageSrcSet(src, responsiveWidths, { quality, resize });


  return (
    <img
      src={displaySrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes ?? "100vw" : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      {...rest}
    />
  );
}
