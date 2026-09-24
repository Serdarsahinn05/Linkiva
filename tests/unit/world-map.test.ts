import { describe, expect, it } from "vitest";
import { WORLD_PATHS } from "@/lib/world-map";

describe("world map", () => {
  const codes = WORLD_PATHS.map(([iso]) => iso);

  it("keys every country by a unique ISO alpha-2 code", () => {
    expect(codes.every((c) => /^[A-Z]{2}$/.test(c))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("covers the countries Natural Earth marks -99 and our main audience", () => {
    for (const code of ["TR", "AZ", "DE", "US", "GB", "FR", "NO"]) expect(codes).toContain(code);
  });
});
