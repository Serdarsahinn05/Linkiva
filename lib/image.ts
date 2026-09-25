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

/** Average WCAG relative luminance of an image (0 black … 1 white), sampled at 32×32. */
export async function averageLuminance(image: Blob): Promise<number> {
  const bitmap = await createImageBitmap(image, { resizeWidth: 32, resizeHeight: 32, resizeQuality: "medium" });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, 32, 32);
  const linear = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.2126 * linear(data[i]!) + 0.7152 * linear(data[i + 1]!) + 0.0722 * linear(data[i + 2]!);
  return sum / (data.length / 4);
}
