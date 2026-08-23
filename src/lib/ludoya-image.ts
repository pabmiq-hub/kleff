const LUDOYA_IMAGE_HOST = "ludoya-images.s3.eu-west-par.io.cloud.ovh.net";

/** Routes Ludoya's binary image responses through our origin to avoid browser ORB blocking. */
export function getLudoyaImageUrl(source: string | null | undefined): string {
  if (!source) return "";

  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== LUDOYA_IMAGE_HOST) return source;
    return `/api/public/ludoya-image?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return source;
  }
}