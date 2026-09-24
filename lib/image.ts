/**
 * Downsizes an image in the browser and re-encodes it as WebP (no image library needed).
 * square: centre-crop to a square first (avatars).
 */
export async function toWebp(file: File, maxSide: number, { square = false } = {}): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const srcW = square ? Math.min(bitmap.width, bitmap.height) : bitmap.width;
  const srcH = square ? srcW : bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, (bitmap.width - srcW) / 2, (bitmap.height - srcH) / 2, srcW, srcH, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.86));
}
