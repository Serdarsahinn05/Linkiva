export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Every file a user uploads lives under this prefix, so account deletion can remove all of it. */
export const userUploadPrefix = (userId: string) => `u/${userId}/`;

/** Folder of Image-block photos inside a user's prefix (garbage-collected against the blocks that use them). */
export const blockImagePrefix = (userId: string) => `${userUploadPrefix(userId)}block/`;

/**
 * Store id from a Vercel Blob read-write token ("vercel_blob_rw_<storeId>_<secret>"). Public URLs of that
 * store live on "<storeId>.public.blob.vercel-storage.com".
 */
export function blobStoreId(token: string | undefined): string | null {
  return token?.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1]?.toLowerCase() ?? null;
}

/** True when `url` is a public file of our Blob store (any user). Ownership is checked with isOwnBlobUrl. */
export function isBlobStoreUrl(url: string, storeId: string | null = blobStoreId(process.env.BLOB_READ_WRITE_TOKEN)): boolean {
  try {
    const u = new URL(url);
    const hostOk = storeId ? u.hostname === `${storeId}.public.blob.vercel-storage.com` : u.hostname.endsWith(".public.blob.vercel-storage.com");
    return u.protocol === "https:" && hostOk;
  } catch {
    return false;
  }
}

/**
 * True when `url` is in the given user's folder of *our* Blob store (when the store is known),
 * so a profile cannot point at files hosted on some other Blob store.
 */
export function isOwnBlobUrl(url: string, userId: string, storeId: string | null = blobStoreId(process.env.BLOB_READ_WRITE_TOKEN)): boolean {
  if (!isBlobStoreUrl(url, storeId)) return false;
  return new URL(url).pathname.startsWith(`/${userUploadPrefix(userId)}`);
}
