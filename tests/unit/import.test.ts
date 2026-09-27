import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectBlock } from "@/features/editor/detect-block";
import { findImporter } from "@/features/import/importers";
import { parseLinktree } from "@/features/import/linktree";

const fixture = readFileSync("tests/fixtures/linktree.html", "utf8");

describe("parseLinktree", () => {
  const page = parseLinktree(fixture);

  it("reads name and bio", () => {
    expect(page?.displayName).toBe("Deniz Yılmaz");
    expect(page?.bio).toBe("Müzisyen · İstanbul");
  });

  it("keeps the page order and maps each item to a block kind", () => {
    expect(page?.items).toEqual([
      { kind: "LINK", title: "İlk link", url: "https://example.com/first" },
      { kind: "HEADER", text: "Dinle" },
      { kind: "LINK", title: "Yeni albüm", url: "https://example.com/album" },
      { kind: "EMBED", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      // An untitled link gets its host as the title.
      { kind: "LINK", title: "shop.example.com", url: "https://shop.example.com/tshirt" },
    ]);
  });

  it("drops unsafe and address-less items", () => {
    const urls = page?.items.flatMap((i) => ("url" in i && i.url ? [i.url] : [])) ?? [];
    expect(urls.some((u) => u.startsWith("javascript:"))).toBe(false);
  });

  it("maps known social platforms once each and skips unknown ones", () => {
    expect(page?.socials).toEqual([
      { platform: "INSTAGRAM", value: "https://instagram.com/deniz" },
      { platform: "X", value: "https://twitter.com/deniz" },
      { platform: "EMAIL", value: "mailto:deniz@example.com" },
    ]);
  });

  it("returns null for pages without profile data", () => {
    expect(parseLinktree("<html><body>nothing here</body></html>")).toBeNull();
    expect(parseLinktree('<script id="__NEXT_DATA__">{not json</script>')).toBeNull();
    expect(parseLinktree('<script id="__NEXT_DATA__">{"props":{"pageProps":{"links":"nope"}}}</script>')).toBeNull();
  });
});

describe("findImporter", () => {
  it("accepts linktr.ee profile addresses in any common form", () => {
    for (const input of ["linktr.ee/deniz", "https://linktr.ee/deniz", "https://www.linktr.ee/deniz/", "LINKTR.EE/deniz?utm=x"]) {
      expect(findImporter(input)).toMatchObject({ source: "page", url: "https://linktr.ee/deniz" });
    }
  });

  it("fetches only allow-listed hosts and profile paths", () => {
    expect(findImporter("https://example.com/deniz")).toBeNull();
    expect(findImporter("https://linktr.ee.evil.com/deniz")).toBeNull();
    expect(findImporter("https://linktr.ee/")).toBeNull();
    expect(findImporter("https://linktr.ee/s/about")).toBeNull();
    expect(findImporter("javascript:alert(1)")).toBeNull();
    expect(findImporter("https://linktr.ee/deniz")).toMatchObject({ hosts: ["linktr.ee", "www.linktr.ee"] });
  });

  it("reads a GitHub user, never a repository or a GitHub page (Faz 12)", () => {
    for (const input of ["github.com/serdarsahinn05", "https://github.com/serdarsahinn05/", "https://www.github.com/serdarsahinn05?tab=repositories"]) {
      expect(findImporter(input)).toEqual({ source: "github", login: "serdarsahinn05" });
    }
    for (const input of ["https://github.com/serdarsahinn05/linkiva", "https://github.com/settings", "https://github.com/orgs", "https://github.com/-bad", "https://gist.github.com/serdar"]) {
      expect(findImporter(input), input).toBeNull();
    }
  });
});

describe("detectBlock", () => {
  it("turns players into embeds, bio-link pages into imports, the rest into links", () => {
    expect(detectBlock("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "EMBED", url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(detectBlock("open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")?.kind).toBe("EMBED");
    expect(detectBlock("linktr.ee/deniz")).toEqual({ kind: "IMPORT", url: "https://linktr.ee/deniz" });
    expect(detectBlock(" github.com/deniz ")).toEqual({ kind: "LINK", url: "https://github.com/deniz", title: "github.com" });
  });

  it("ignores text that is not a single safe address", () => {
    expect(detectBlock("")).toBeNull();
    expect(detectBlock("merhaba dünya")).toBeNull();
    expect(detectBlock("javascript:alert(1)")).toBeNull();
  });
});
