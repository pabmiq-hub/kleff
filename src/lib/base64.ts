// Convert an ArrayBuffer to a base64 string in chunks so large files don't blow
// the JS call stack (which happens with `String.fromCharCode(...new Uint8Array(buf))`
// once the buffer is more than a few hundred KB).
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000; // 32 KB
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, slice as unknown as number[]);
  }
  return btoa(binary);
}
