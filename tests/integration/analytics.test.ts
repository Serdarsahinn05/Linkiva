import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));

const { db } = await import("@/lib/db");
const { getAnalytics } = await import("@/features/analytics/queries");

const suffix = Date.now().toString(36);
const userId = `an-${suffix}`;
let profile: { id: string; timezone: string };
const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000);

beforeAll(async () => {
  const user = await db.user.create({
    data: { id: userId, name: "a", email: `${userId}@example.com`, emailVerified: true, profile: { create: { username: userId, timezone: "Europe/Istanbul" } } },
    include: { profile: true },
  });
  profile = { id: user.profile!.id, timezone: "Europe/Istanbul" };
  const link = await db.block.create({ data: { profileId: profile.id, type: "LINK", position: 0, data: { title: "Site", url: "https://example.com/" } } });

  const view = (createdAt: Date, visitorHash: string, extra = {}) => ({ profileId: profile.id, type: "VIEW" as const, visitorHash, createdAt, ...extra });
  const clickEv = (createdAt: Date, visitorHash: string) => ({ profileId: profile.id, blockId: link.id, type: "CLICK" as const, visitorHash, createdAt });
  await db.event.createMany({
    data: [
      // This week: 3 views from 2 visitors, 1 click.
      view(ago(1), "v1", { referrerHost: "instagram.com", country: "TR", device: "MOBILE" as const }),
      view(ago(2), "v1", { referrerHost: "instagram.com", country: "TR", device: "MOBILE" as const }),
      view(ago(3), "v2", { utmSource: "newsletter", country: "DE", device: "DESKTOP" as const }),
      clickEv(ago(1), "v1"),
      // Previous week: 1 view.
      view(ago(10), "v3"),
      // Two months ago: 1 view.
      view(ago(60), "v4"),
    ],
  });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { startsWith: "an-" } } });
  await db.$disconnect();
});

describe("getAnalytics", () => {
  it("really filters by range (v1 bug A3: the picker changed only a label)", async () => {
    expect((await getAnalytics(profile, "7d", "tr")).totals).toMatchObject({ views: 3, visitors: 2, clicks: 1 });
    expect((await getAnalytics(profile, "30d", "tr")).totals).toMatchObject({ views: 4, visitors: 3 });
    expect((await getAnalytics(profile, "90d", "tr")).totals.views).toBe(5);
    expect((await getAnalytics(profile, "all", "tr")).totals.views).toBe(5);
  });

  it("compares with the previous period, and has nothing to compare for all time", async () => {
    const week = await getAnalytics(profile, "7d", "tr");
    expect(week.trend.views).toBeCloseTo((3 - 1) / 1);
    expect((await getAnalytics(profile, "all", "tr")).trend.views).toBeNull();
  });

  it("attributes sources (utm over referrer), countries and devices from views", async () => {
    const a = await getAnalytics(profile, "7d", "tr");
    expect(a.sources.map((s) => [s.key, s.value])).toEqual([
      ["instagram.com", 2],
      ["newsletter", 1],
    ]);
    expect(a.countries[0]).toMatchObject({ key: "TR", label: "Türkiye", value: 2 });
    expect(a.devices.map((d) => d.key)).toEqual(["MOBILE", "DESKTOP"]);
    expect(a.links[0]).toMatchObject({ title: "Site", clicks: 1 });
  });

  it("returns a continuous day axis for the range", async () => {
    const a = await getAnalytics(profile, "7d", "tr");
    expect(a.series).toHaveLength(7);
    expect(a.series.reduce((sum, d) => sum + d.views, 0)).toBe(3);
  });
});

describe("scale (docs/ROADMAP.md Phase 4 acceptance)", () => {
  it("answers in under 500ms with 100k events", async () => {
    const batch = Array.from({ length: 100_000 }, (_, i) => ({
      profileId: profile.id,
      type: (i % 5 === 0 ? "CLICK" : "VIEW") as "CLICK" | "VIEW",
      visitorHash: `h${i % 20_000}`,
      referrerHost: ["instagram.com", "x.com", null][i % 3] ?? null,
      country: ["TR", "DE", "US"][i % 3] ?? null,
      device: (["MOBILE", "DESKTOP", "TABLET"] as const)[i % 3],
      createdAt: ago(i % 90, i % 24),
    }));
    for (let i = 0; i < batch.length; i += 10_000) await db.event.createMany({ data: batch.slice(i, i + 10_000) });

    await getAnalytics(profile, "30d", "tr"); // warm up the connection pool and plans
    const started = performance.now();
    const result = await getAnalytics(profile, "30d", "tr");
    const elapsed = performance.now() - started;
    console.info(`getAnalytics(30d) over ~100k events: ${elapsed.toFixed(0)}ms`);
    expect(result.totals.views).toBeGreaterThan(20_000);
    expect(elapsed).toBeLessThan(500);
  }, 120_000);
});
