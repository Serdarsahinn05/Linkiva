import { describe, expect, it } from "vitest";
import { normalizeSocial, socialUrl } from "@/lib/socials";
import { parseBlock } from "@/lib/validation/blocks";
import { displayHost, normalizeUrl } from "@/lib/validation/url";

describe("normalizeUrl", () => {
  it.each([
    ["github.com/serdar", "https://github.com/serdar"],
    ["https://linkiva.space", "https://linkiva.space/"],
    ["http://example.com/a?b=1", "http://example.com/a?b=1"],
    ["mailto:hi@example.com", "mailto:hi@example.com"],
    ["tel:+905551112233", "tel:+905551112233"],
  ])("%s → %s", (input, expected) => expect(normalizeUrl(input)).toBe(expected));

  it.each(["javascript:alert(1)", "data:text/html,<script>", "file:///etc/passwd", "not a url", "", "https://nodot"])("rejects %s", (input) => {
    expect(normalizeUrl(input)).toBeNull();
  });

  it("shows a clean host", () => {
    expect(displayHost("https://www.github.com/x")).toBe("github.com");
  });
});

describe("normalizeSocial", () => {
  it.each([
    ["INSTAGRAM", "@serdar", "serdar"],
    ["INSTAGRAM", "instagram.com/serdar", "serdar"],
    ["INSTAGRAM", "https://www.instagram.com/serdar/", "serdar"],
    ["X", "https://twitter.com/serdar", "serdar"],
    ["LINKEDIN", "linkedin.com/in/serdar-sahin", "serdar-sahin"],
    ["GITHUB", "Serdarsahinn05", "Serdarsahinn05"],
    ["EMAIL", "Hi@Example.com", "hi@example.com"],
    ["WEBSITE", "serdar.dev", "https://serdar.dev/"],
  ] as const)("%s %s → %s", (platform, input, expected) => {
    expect(normalizeSocial(platform, input)).toBe(expected);
  });

  it("never double-prefixes (v1 bug B5)", () => {
    const stored = normalizeSocial("INSTAGRAM", "instagram.com/kullanici");
    expect(socialUrl("INSTAGRAM", stored!)).toBe("https://instagram.com/kullanici");
  });

  it("rejects junk", () => {
    expect(normalizeSocial("INSTAGRAM", "bad handle!")).toBeNull();
    expect(normalizeSocial("EMAIL", "nope")).toBeNull();
    expect(normalizeSocial("WEBSITE", "javascript:alert(1)")).toBeNull();
  });
});

describe("parseBlock", () => {
  it("accepts valid data and normalises the url", () => {
    expect(parseBlock("LINK", { title: "GitHub", url: "github.com/x" })).toEqual({
      type: "LINK",
      data: { title: "GitHub", url: "https://github.com/x" },
    });
  });
  it("rejects unsafe or unfinished blocks", () => {
    expect(parseBlock("LINK", { title: "x", url: "javascript:alert(1)" })).toBeNull();
    expect(parseBlock("LINK", { title: "", url: "" })).toBeNull();
    expect(parseBlock("HEADER", { text: "x".repeat(81) })).toBeNull();
  });
});

describe("isOwnBlobUrl", () => {
  it("only accepts blob URLs inside the user's folder", async () => {
    const { isOwnBlobUrl } = await import("@/lib/uploads");
    const base = "https://abc.public.blob.vercel-storage.com";
    expect(isOwnBlobUrl(`${base}/u/user1/avatar-x.webp`, "user1")).toBe(true);
    expect(isOwnBlobUrl(`${base}/u/user2/avatar-x.webp`, "user1")).toBe(false);
    expect(isOwnBlobUrl("https://evil.example/u/user1/avatar.webp", "user1")).toBe(false);
    expect(isOwnBlobUrl(`http://abc.public.blob.vercel-storage.com/u/user1/a.webp`, "user1")).toBe(false);
  });
});

describe("parseEmbed", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
    ["youtu.be/dQw4w9WgXcQ", "youtube"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "youtube"],
    ["https://open.spotify.com/intl-tr/track/4uLU6hMCjMI75M1A2tKUQC", "spotify"],
    ["https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M", "spotify"],
    ["https://soundcloud.com/artist/track-name", "soundcloud"],
  ])("%s → %s", async (url, provider) => {
    const { parseEmbed } = await import("@/lib/embeds");
    expect(parseEmbed(url)?.provider).toBe(provider);
  });

  it("rebuilds the iframe src from ids and rejects everything else", async () => {
    const { parseEmbed } = await import("@/lib/embeds");
    expect(parseEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=<script>")?.src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    expect(parseEmbed("https://evil.example/embed?youtube.com")).toBeNull();
    expect(parseEmbed("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseEmbed("javascript:alert(1)")).toBeNull();
  });
});

describe("csvCell", () => {
  it("quotes and neutralises spreadsheet formulas", async () => {
    const { csvCell } = await import("@/lib/csv");
    expect(csvCell("a@b.com")).toBe('"a@b.com"');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
  });
});
