import { env } from "@/lib/env";

const LEGACY_IMAGE_BASE = "/images";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve product image from API (signed URL, aws key, uploads, or seed filename). */
export function resolveProductImageUrl(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  const value = raw.trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const uploadsMatch = value.match(/^\/?uploads\/(.+)$/);
  if (uploadsMatch?.[1] && !uploadsMatch[1].includes("..")) {
    const base = env.backendUrl.replace(/\/api\/?$/, "");
    return `${base}/uploads/${uploadsMatch[1]}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (value.startsWith("aws")) {
    const base = env.assetUrl.replace(/\/$/, "");
    return `${base}/${value}`;
  }

  if (/\.[a-zA-Z0-9]+$/.test(value)) {
    return `${LEGACY_IMAGE_BASE}/${value}`;
  }

  if (UUID.test(value)) {
    return null;
  }

  return `${LEGACY_IMAGE_BASE}/${value}.jpg`;
}
