/**
 * Append the CDN resize param so covers are fetched at display size.
 * A 40px list thumb is decoded at 80x80 instead of the full 640x640 source,
 * which cuts per-image memory by ~64x.
 * Respects URLs that already carry a `param=` (e.g. avatars).
 */
export function sizedImage(url: string, size: number): string {
  if (!url || url.startsWith("data:") || url.includes("param=")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}param=${size}y${size}`;
}
