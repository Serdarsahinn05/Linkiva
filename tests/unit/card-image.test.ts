import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { toCardWebp } from "@/lib/card-image";

describe("toCardWebp", () => {
  it("turns a large PNG into a 1200px WebP that is much smaller", async () => {
    const png = await sharp({ create: { width: 2400, height: 1260, channels: 3, background: "#1e78c8" } })
      .composite([{ input: Buffer.from('<svg width="2400" height="1260"><circle cx="1200" cy="630" r="500" fill="#fff"/></svg>') }])
      .png()
      .toBuffer();
    const webp = await toCardWebp(png);
    expect(webp).not.toBeNull();
    const meta = await sharp(webp!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1200);
    expect(webp!.length).toBeLessThan(png.length);
  });

  it("never enlarges a small image", async () => {
    const small = await sharp({ create: { width: 300, height: 157, channels: 3, background: "#000" } }).png().toBuffer();
    expect((await sharp((await toCardWebp(small))!).metadata()).width).toBe(300);
  });

  it("returns null for bytes that are not an image", async () => {
    expect(await toCardWebp(Buffer.from("<html>not an image</html>"))).toBeNull();
  });
});
