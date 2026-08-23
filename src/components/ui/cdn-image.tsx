import { getOptimizedImageUrl, getResponsiveImageSrcSet } from "@/lib/image-delivery";

type CdnImageProps = {
  src: string;
  alt: string;
  width: number;
  height?: number;
  /** Candidate widths for the WebP srcSet. */
  widths?: readonly number[];
  sizes?: string;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
  priority?: boolean;
  className?: string;
  imgClassName?: string;
};

/**
 * Renders a <picture> with a WebP source served by the Storage image
 * transformation endpoint (`/storage/v1/render/image/public/...`) and the
 * original file as <img> fallback for browsers without WebP support.
 */
export function CdnImage({
  src,
  alt,
  width,
  height,
  widths,
  sizes,
  quality = 76,
  resize = "cover",
  priority = false,
  className,
  imgClassName,
}: CdnImageProps) {
  const candidates = widths ?? [Math.round(width / 2), width, Math.round(width * 1.5)];
  const webpSrcSet = getResponsiveImageSrcSet(src, candidates, { height, quality, resize });
  const fallback = getOptimizedImageUrl(src, { width, height, quality, resize });

  return (
    <picture className={className}>
      {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
      <img
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
        className={imgClassName}
      />
    </picture>
  );
}
