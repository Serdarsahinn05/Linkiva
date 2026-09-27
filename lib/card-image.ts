import sharp from "sharp";

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
