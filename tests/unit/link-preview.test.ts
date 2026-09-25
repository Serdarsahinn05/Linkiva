import { describe, expect, it } from "vitest";
import { imageType, isPublicAddress, parsePreview } from "@/lib/link-preview";

describe("isPublicAddress (SSRF guard)", () => {
  it.each([
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::a00:1", "not-an-ip",
  ])("refuses %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(["93.184.215.14", "1.1.1.1", "172.32.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])("allows %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });
});

describe("parsePreview", () => {
  const page = "https://example.com/blog/post";

  it("prefers Open Graph, resolves a relative image and decodes entities", () => {
    const html = `<html><head><title>Plain</title>
      <meta property="og:title" content="Tom &amp; Jerry&#39;s &quot;Show&quot;">
      <meta content='Kısa açıklama' name='description'>
      <meta property="og:image" content="/img/cover.jpg">
      </head><body><meta property="og:title" content="Ignored"></body></html>`;
    expect(parsePreview(html, page)).toEqual({ title: `Tom & Jerry's "Show"`, description: "Kısa açıklama", image: "https://example.com/img/cover.jpg" });
  });

  it("falls back to <title> and drops non-http images", () => {
    const html = `<head><title>  Just a   title </title><meta property="og:image" content="javascript:alert(1)"></head>`;
    expect(parsePreview(html, page)).toEqual({ title: "Just a title", description: undefined, image: undefined });
  });

  it("shortens long text", () => {
    const html = `<head><meta name="description" content="${"a".repeat(400)}"></head>`;
    expect(parsePreview(html, page).description).toHaveLength(200);
  });
});

describe("imageType", () => {
  it("sniffs by magic bytes, not by name", () => {
    expect(imageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(imageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(imageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});
