import sharp from "sharp";
import { isBlobStoreUrl } from "@/lib/uploads";

/** Cards render at most ~560 CSS px wide; twice that covers high-density screens. */
const CARD_WIDTH = 1200;
/** Refuse images that would decode to more than this many pixels (decompression bombs). */
const MAX_INPUT_PIXELS = 40_000_000;

/**
 * A page's preview image as a compact WebP for link and product cards (the profile's largest paint).
 * Only the first frame of an animation is kept. null when the bytes cannot be decoded as an image.
 */
export async function toCardWebp(bytes: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(bytes, { limitInputPixels: MAX_INPUT_PIXELS, animated: false })
      .rotate() // honour EXIF orientation
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    return null;
  }
}

/**
 * One of our own Blob images (avatar, background) as a data URI Satori can draw. Uploads are WebP, which Satori cannot
 * decode (the avatar came out blank in OG and story images), so it is re-encoded: PNG keeps the avatar crisp, JPEG
 * keeps a full-screen background small. Anything not on our store, or unreadable, gives null.
 */
export async function forImageResponse(url: string | null | undefined, width: number, format: "png" | "jpeg"): Promise<string | null> {
  if (!url || !isBlobStoreUrl(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const image = sharp(Buffer.from(await res.arrayBuffer()), { limitInputPixels: MAX_INPUT_PIXELS, animated: false }).rotate().resize({ width, withoutEnlargement: true });
    const bytes = format === "png" ? await image.png().toBuffer() : await image.jpeg({ quality: 82 }).toBuffer();
    return `data:image/${format};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
