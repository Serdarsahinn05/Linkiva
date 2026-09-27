import { describe, expect, it } from "vitest";
import { computeInsights } from "@/features/analytics/insights";

const empty = () => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
const links = [
  { id: "a", title: "Portfolyo", clicks: 30 },
  { id: "b", title: "Blog", clicks: 5 },
];
const base = {
  totalViews: 100,
  sources: [
    { key: "direct", value: 50 },
    { key: "instagram.com", value: 40 },
  ],
  links,
  sourceLinks: [
    { source: "instagram.com", blockId: "a", clicks: 18 },
    { source: "instagram.com", blockId: "b", clicks: 2 },
  ],
  heatmap: empty(),
};

describe("computeInsights", () => {
  it("says nothing below the minimum sample", () => {
    expect(computeInsights({ ...base, totalViews: 29 })).toEqual([]);
  });

  it("names the link most visitors from the top real source clicked", () => {
    expect(computeInsights(base)).toContainEqual({ kind: "sourceLink", source: "instagram.com", linkTitle: "Portfolyo", share: 0.9 });
  });

  it("skips the source finding when no link clearly leads", () => {
    const even = { ...base, sourceLinks: [{ source: "instagram.com", blockId: "a", clicks: 6 }, { source: "instagram.com", blockId: "b", clicks: 6 }, { source: "instagram.com", blockId: "c", clicks: 6 }] };
    expect(computeInsights(even).some((i) => i.kind === "sourceLink")).toBe(false);
  });

  it("finds a busy evening window, and only when it stands out", () => {
    const heatmap = empty();
    for (const day of heatmap) {
      day[20] = 4;
      day[21] = 4;
      day[22] = 2;
    }
    expect(computeInsights({ ...base, heatmap })).toContainEqual({ kind: "peakHours", from: 20, to: 23, share: 0.7 });
    const flat = empty().map((day) => day.map(() => 1));
    expect(computeInsights({ ...base, heatmap: flat }).some((i) => i.kind === "peakHours")).toBe(false);
  });

  it("reports the biggest link change against the previous period", () => {
    const result = computeInsights({ ...base, previousLinkClicks: { a: 60, b: 5 } });
    expect(result).toContainEqual({ kind: "linkChange", linkTitle: "Portfolyo", change: -0.5 });
    // Small numbers on both sides are noise.
    expect(computeInsights({ ...base, links: [{ id: "b", title: "Blog", clicks: 5 }], previousLinkClicks: { b: 2 } }).some((i) => i.kind === "linkChange")).toBe(false);
  });
});
