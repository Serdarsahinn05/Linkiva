export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Every file a user uploads lives under this prefix, so account deletion can remove all of it. */
export const userUploadPrefix = (userId: string) => `u/${userId}/`;

/** True when `url` is a Vercel Blob URL inside the given user's folder. */
export function isOwnBlobUrl(url: string, userId: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com") && u.pathname.startsWith(`/${userUploadPrefix(userId)}`);
  } catch {
    return false;
  }
}
