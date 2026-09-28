import { describe, expect, it } from "vitest";
import { isLocale, matchAcceptLanguage } from "@/i18n/config";
import { languageAlternates, localizedPath, MARKETING_PAGES, marketingLocale } from "@/i18n/marketing";
import { site } from "@/lib/site";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

describe("matchAcceptLanguage", () => {
  it("picks the highest-weighted supported language", () => {
    expect(matchAcceptLanguage("de-DE,de;q=0.9,en;q=0.8,tr;q=0.7")).toBe("en");
    expect(matchAcceptLanguage("tr-TR,tr;q=0.9")).toBe("tr");
  });
  it("returns undefined for unsupported or missing headers", () => {
    expect(matchAcceptLanguage("fr-FR,fr;q=0.9")).toBeUndefined();
    expect(matchAcceptLanguage(null)).toBeUndefined();
  });
  it("guards locale values", () => {
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("TR")).toBe(false);
  });
});

describe("message catalogues", () => {
  const keys = (obj: object, prefix = ""): string[] =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
    );

  it("tr and en define exactly the same keys", () => {
    expect(keys(en).sort()).toEqual(keys(tr).sort());
  });
});

describe("site page addresses", () => {
  it("maps every page to a fixed Turkish and English address", () => {
    for (const page of MARKETING_PAGES) {
      expect(marketingLocale(localizedPath(page, "tr"))).toBe("tr");
      expect(marketingLocale(localizedPath(page, "en"))).toBe("en");
    }
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/privacy", "en")).toBe("/en/privacy");
  });

  it("leaves every other path to the cookie", () => {
    for (const path of ["/register", "/dashboard", "/serdar", "/en/", "/en/dashboard", "/english"]) expect(marketingLocale(path)).toBeUndefined();
  });

  it("gives hreflang for both languages with Turkish as the default", () => {
    expect(languageAlternates("/terms")).toEqual({ tr: `${site.url}/terms`, en: `${site.url}/en/terms`, "x-default": `${site.url}/terms` });
    expect(languageAlternates("/")).toEqual({ tr: site.url, en: `${site.url}/en`, "x-default": site.url });
  });
});
