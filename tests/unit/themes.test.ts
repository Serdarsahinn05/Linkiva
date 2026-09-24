import { describe, expect, it } from "vitest";
import { contrastRatio, inkOn, resolveAppearance, THEME_KEYS } from "@/themes";

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
