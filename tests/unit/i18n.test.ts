import { describe, expect, it } from "vitest";
import { isLocale, matchAcceptLanguage } from "@/i18n/config";
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
