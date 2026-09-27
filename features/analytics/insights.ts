/**
 * Plain-language findings for the analytics page and the weekly digest, computed from aggregates (no LLM).
 * Each one has a minimum sample: below it, nothing is said rather than something misleading (PRODUCT principle 4).
 */

/** Below this many views in the period, no insight is shown at all. */
export const MIN_VIEWS = 30;

export type Insight =
  | { kind: "sourceLink"; source: string; linkTitle: string; share: number }
  | { kind: "peakHours"; from: number; to: number; share: number }
  | { kind: "linkChange"; linkTitle: string; change: number };

type Input = {
  totalViews: number;
  /** Views per source (top first is fine; order does not matter). */
  sources: { key: string; value: number }[];
  links: { id: string; title: string; clicks: number }[];
  sourceLinks: { source: string; blockId: string; clicks: number }[];
  /** Views by weekday × hour. */
  heatmap: number[][];
  /** Previous period's clicks per block; undefined when there is no previous period ("all"). */
  previousLinkClicks?: Record<string, number>;
};

/** Visitors from the top real source (not "direct") mostly clicked one link. */
function sourceLink({ sources, links, sourceLinks }: Input): Insight | null {
  const top = [...sources].filter((s) => s.key !== "direct").sort((a, b) => b.value - a.value)[0];
  if (!top || top.value < 20) return null;
  const rows = sourceLinks.filter((r) => r.source === top.key);
  const total = rows.reduce((sum, r) => sum + r.clicks, 0);
  const best = rows.sort((a, b) => b.clicks - a.clicks)[0];
  const link = best && links.find((l) => l.id === best.blockId);
  if (!best || !link || best.clicks < 5 || best.clicks / total < 0.4) return null;
  return { kind: "sourceLink", source: top.key, linkTitle: link.title, share: best.clicks / total };
}

/** The busiest three-hour window of the day, when it holds a clear share of visits. */
function peakHours({ heatmap, totalViews }: Input): Insight | null {
  const byHour = Array.from({ length: 24 }, (_, h) => heatmap.reduce((sum, day) => sum + (day[h] ?? 0), 0));
  let best = { from: 0, views: -1 };
  for (let h = 0; h < 24; h++) {
    const views = byHour[h]! + byHour[(h + 1) % 24]! + byHour[(h + 2) % 24]!;
    if (views > best.views) best = { from: h, views };
  }
  const share = totalViews > 0 ? best.views / totalViews : 0;
  // Three hours out of 24 is 12.5% by chance; say it only when it is well above that.
  return share >= 0.3 ? { kind: "peakHours", from: best.from, to: (best.from + 3) % 24, share } : null;
}

/** The link whose clicks moved the most against the previous period (both periods with enough clicks). */
function linkChange({ links, previousLinkClicks }: Input): Insight | null {
  if (!previousLinkClicks) return null;
  let best: { title: string; change: number } | null = null;
  for (const link of links) {
    const before = previousLinkClicks[link.id] ?? 0;
    if (before < 10 && link.clicks < 10) continue;
    if (before === 0) continue;
    const change = (link.clicks - before) / before;
    if (Math.abs(change) >= 0.3 && (!best || Math.abs(change) > Math.abs(best.change))) best = { title: link.title, change };
  }
  return best ? { kind: "linkChange", linkTitle: best.title, change: best.change } : null;
}

/** At most three findings, in a fixed order; none when the period has too few views. */
export function computeInsights(input: Input): Insight[] {
  if (input.totalViews < MIN_VIEWS) return [];
  return [sourceLink(input), peakHours(input), linkChange(input)].filter((i): i is Insight => i !== null);
}
