import { describe, expect, it } from "vitest";
import { contrastRatio, DIM_MAX, GROUND, inkOn, minDim, readableAccent, resolveAppearance, suggestForBackground, THEME_KEYS } from "@/themes";

describe("resolveAppearance", () => {
  it("falls back to the cam preset for unknown themes and junk data", () => {
    expect(resolveAppearance("etiket", { font: "comic-sans", mode: 3 })).toMatchObject({ theme: "cam", font: "geist", mode: "system", button: "glass" });
  });

  it("applies owner overrides on top of the preset", () => {
    const a = resolveAppearance("terminal", { font: "rounded", accent: "#123456", backgroundUrl: null });
    expect(a).toMatchObject({ theme: "terminal", mode: "dark", font: "rounded", button: "outline", accent: "#123456" });
  });

  it("lets the owner clear a preset accent", () => {
    expect(resolveAppearance("afis", { accent: null }).accent).toBeNull();
  });
});

describe("contrast protection", () => {
  it("every preset accent gets a readable ink (≥ 4.5:1)", () => {
    for (const theme of THEME_KEYS) {
      const { accent } = resolveAppearance(theme, {});
      if (accent) expect(contrastRatio(accent, inkOn(accent))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(["#FFFF00", "#000000", "#FF5A36", "#7CF5A8", "#2244FF", "#808080"])("%s picks the better ink", (accent) => {
    const ink = inkOn(accent);
    const other = ink === "#FFFFFF" ? "#111318" : "#FFFFFF";
    expect(contrastRatio(accent, ink)).toBeGreaterThanOrEqual(contrastRatio(accent, other));
  });
});

describe("readability", () => {
  it.each(["#FFE14D", "#7CF5A8", "#2244FF", "#FF5A36", "#111318", "#FFFFFF", "#808080"])("%s becomes readable text on both grounds", (accent) => {
    for (const ground of [GROUND.light, GROUND.dark]) {
      const tone = readableAccent(accent, ground);
      expect(contrastRatio(tone, ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tone, inkOn(tone))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("leaves an already readable accent alone", () => {
    expect(readableAccent("#111318", GROUND.light)).toBe("#111318");
  });

  it("needs more dim the further the photo is from the ground", () => {
    expect(minDim(0.9, "dark")).toBeGreaterThan(minDim(0.2, "dark"));
    expect(minDim(0.02, "light")).toBeGreaterThan(minDim(0.6, "light"));
    expect(minDim(1, "dark")).toBeLessThanOrEqual(DIM_MAX);
  });

  it("suggests the mode that suits the photo, never with a bare photo", () => {
    expect(suggestForBackground(0.85)).toMatchObject({ mode: "light" });
    expect(suggestForBackground(0.03)).toMatchObject({ mode: "dark" });
    expect(suggestForBackground(0.03).dim).toBeGreaterThanOrEqual(30);
  });

  it("keeps the default dim for profiles saved before the setting existed", () => {
    expect(resolveAppearance("cam", { backgroundUrl: "https://x.public.blob.vercel-storage.com/a.webp" })).toMatchObject({ backgroundDim: 55, backgroundTone: null });
  });
});
