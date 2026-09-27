import { describe, expect, it } from "vitest";
import { allowedSizes, effectiveSize } from "@/lib/validation/blocks";
import { resolveAppearance } from "@/themes";

describe("grid layout (ROADMAP Faz 10)", () => {
  it("is off unless the owner picks it, and survives any theme", () => {
    expect(resolveAppearance("cam", {}).layout).toBe("list");
    expect(resolveAppearance("terminal", { layout: "grid" }).layout).toBe("grid");
    expect(resolveAppearance("cam", { layout: "masonry" }).layout).toBe("list");
  });

  it("offers tile sizes only where the content fits a tile", () => {
    expect(allowedSizes("LINK")).toEqual(["SMALL", "WIDE", "LARGE"]);
    expect(allowedSizes("WHATSAPP")).toEqual(["SMALL", "WIDE"]);
    for (const type of ["HEADER", "TEXT", "DIVIDER", "EMAIL_CAPTURE", "COUNTDOWN", "EMBED", "SUPPORT"] as const) {
      expect(allowedSizes(type)).toEqual(["WIDE"]);
    }
  });

  it("renders a size the type does not allow as a full row", () => {
    expect(effectiveSize("IMAGE", "LARGE")).toBe("LARGE");
    expect(effectiveSize("CONTACT", "LARGE")).toBe("WIDE");
    expect(effectiveSize("HEADER", "SMALL")).toBe("WIDE");
    expect(effectiveSize("LINK", undefined)).toBe("WIDE");
  });
});
