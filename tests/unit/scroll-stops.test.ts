import { describe, expect, it } from "vitest";
import { at, orbitAt, tour } from "@/features/landing/scroll-stops";

describe("orbitAt", () => {
  it("keeps angle and facing bounded however long the page has been open", () => {
    for (const time of [0, 1, 60, 3600, 86_400]) {
      for (let i = 0; i < 9; i++) {
        const { angle, face } = orbitAt(time, i, 9);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(Math.PI * 2);
        expect(Math.abs(face)).toBeLessThanOrEqual(Math.PI);
      }
    }
  });
});

describe("tour", () => {
  it("shows each theme in turn and switches while the back faces the viewer", () => {
    const count = 7;
    expect(tour(0, count)).toEqual({ index: 0, spin: 0 });
    // Just before and after the switch point of the first stretch: the spin is near half a turn.
    const before = tour(0.64 / count, count);
    const after = tour(0.66 / count, count);
    expect(before.index).toBe(0);
    expect(after.index).toBe(1);
    expect(before.spin).toBeGreaterThan(0.4);
    expect(after.spin).toBeLessThan(0.6);
    // The last theme holds without turning.
    expect(tour(1, count)).toEqual({ index: count - 1, spin: 0 });
  });
});

describe("at", () => {
  it("rests on each stop and eases between them", () => {
    expect(at([0, 10], 0)).toBe(0);
    expect(at([0, 10], 1)).toBe(10);
    expect(at([0, 10], 0.5)).toBe(5);
    expect(at([0, 10], 0.25)).toBeLessThan(2.5);
  });
});
