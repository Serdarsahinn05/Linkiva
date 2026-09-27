import { Prisma } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import type { BlockType } from "@/prisma/generated/enums";

export const RANGES = ["7d", "30d", "90d", "all"] as const;
export type Range = (typeof RANGES)[number];
export const isRange = (v: unknown): v is Range => typeof v === "string" && (RANGES as readonly string[]).includes(v);

const DAYS: Record<Exclude<Range, "all">, number> = { "7d": 7, "30d": 30, "90d": 90 };

export type Totals = { views: number; visitors: number; clicks: number; ctr: number };
export type Trend = { views: number | null; visitors: number | null; clicks: number | null; ctr: number | null };
export type DayPoint = { day: string; views: number; clicks: number };
export type Row = { key: string; label: string; value: number; share: number };

export type Analytics = {
  range: Range;
  totals: Totals;
  trend: Trend;
  series: DayPoint[];
  links: { id: string; title: string; clicks: number; ctr: number }[];
  sources: Row[];
  countries: Row[];
  /** Views per ISO country code, every country (the map); `countries` is the top of this list. */
  countryViews: Record<string, number>;
  devices: Row[];
  os: Row[];
  browsers: Row[];
};

function periodOf(range: Range, now = new Date()) {
  if (range === "all") return { from: null, prevFrom: null };
  const ms = DAYS[range] * 86_400_000;
  return { from: new Date(now.getTime() - ms), prevFrom: new Date(now.getTime() - 2 * ms) };
}

async function totalsBetween(profileId: string, from: Date | null, to: Date | null): Promise<Totals> {
  const createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
  const [views, clicks, visitors] = await Promise.all([
    db.event.count({ where: { profileId, type: "VIEW", createdAt } }),
    db.event.count({ where: { profileId, type: "CLICK", createdAt } }),
    db.event.groupBy({ by: ["visitorHash"], where: { profileId, type: "VIEW", createdAt } }).then((g) => g.length),
  ]);
  return { views, visitors, clicks, ctr: views > 0 ? clicks / views : 0 };
}

/** Relative change vs the previous period; null when there is nothing to compare (all time, or 0 → x). */
function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

function toRows(groups: { key: string | null; count: number }[], total: number, label: (key: string) => string, limit = 8): Row[] {
  return groups
    .filter((g): g is { key: string; count: number } => g.key !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((g) => ({ key: g.key, label: label(g.key), value: g.count, share: total > 0 ? g.count / total : 0 }));
}

/**
 * Everything the analytics page shows, for the caller's own profile and the selected range.
 * Aggregated in SQL (v1 loaded every event into memory, bug A9); days are bucketed in the owner's time zone (A7).
 */
export async function getAnalytics(profile: { id: string; timezone: string }, range: Range, locale: string): Promise<Analytics> {
  const { from, prevFrom } = periodOf(range);
  const createdAt = from ? { gte: from } : {};
  const viewWhere = { profileId: profile.id, type: "VIEW" as const, createdAt };

  const [totals, previous, series, clickGroups, blocks, sourceGroups, countryGroups, deviceGroups, osGroups, browserGroups] = await Promise.all([
    totalsBetween(profile.id, from, null),
    prevFrom ? totalsBetween(profile.id, prevFrom, from) : null,
    db.$queryRaw<{ day: Date; views: number; clicks: number }[]>(Prisma.sql`
      SELECT (date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${profile.timezone}))::date AS day,
             count(*) FILTER (WHERE type = 'VIEW')::int AS views,
             count(*) FILTER (WHERE type = 'CLICK')::int AS clicks
      FROM "event"
      WHERE "profileId" = ${profile.id} ${from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty}
      GROUP BY 1 ORDER BY 1`),
    db.event.groupBy({ by: ["blockId"], where: { profileId: profile.id, type: "CLICK", createdAt, blockId: { not: null } }, _count: { _all: true } }),
    db.block.findMany({ where: { profileId: profile.id, type: { in: CLICKABLE } }, select: { id: true, type: true, data: true }, orderBy: { position: "asc" } }),
    db.$queryRaw<{ key: string | null; count: number }[]>(Prisma.sql`
      SELECT coalesce("utmSource", "referrerHost", 'direct') AS key, count(*)::int AS count
      FROM "event" WHERE "profileId" = ${profile.id} AND type = 'VIEW' ${from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty}
      GROUP BY 1`),
    db.event.groupBy({ by: ["country"], where: viewWhere, _count: { _all: true } }),
    db.event.groupBy({ by: ["device"], where: viewWhere, _count: { _all: true } }),
    db.event.groupBy({ by: ["os"], where: viewWhere, _count: { _all: true } }),
    db.event.groupBy({ by: ["browser"], where: viewWhere, _count: { _all: true } }),
  ]);

  const clicksByBlock = new Map(clickGroups.map((g) => [g.blockId, g._count._all]));
  const links = blocks
    // An image counts as a link only when it has one; a support block also counts copies.
    .filter((b) => b.type !== "IMAGE" || Boolean(draftOf(b.data).url))
    .map((b) => {
      const clicks = clicksByBlock.get(b.id) ?? 0;
      return { id: b.id, title: blockLabel(b.type, b.data), clicks, ctr: totals.views > 0 ? clicks / totals.views : 0 };
    })
    .sort((a, b) => b.clicks - a.clicks);

  const regionNames = new Intl.DisplayNames([locale], { type: "region" });
  const views = totals.views;

  return {
    range,
    totals,
    trend: previous
      ? {
          views: change(totals.views, previous.views),
          visitors: change(totals.visitors, previous.visitors),
          clicks: change(totals.clicks, previous.clicks),
          ctr: previous.ctr > 0 ? totals.ctr - previous.ctr : null,
        }
      : { views: null, visitors: null, clicks: null, ctr: null },
    series: fillDays(
      series.map((s) => ({ day: s.day.toISOString().slice(0, 10), views: s.views, clicks: s.clicks })),
      range,
      profile.timezone,
    ),
    links,
    sources: toRows(sourceGroups, views, (k) => k),
    countries: toRows(
      countryGroups.map((g) => ({ key: g.country, count: g._count._all })),
      views,
      (k) => {
        try {
          return regionNames.of(k) ?? k;
        } catch {
          return k;
        }
      },
    ),
    countryViews: Object.fromEntries(countryGroups.flatMap((g) => (g.country ? [[g.country, g._count._all]] : []))),
    devices: toRows(deviceGroups.map((g) => ({ key: g.device, count: g._count._all })), views, (k) => k),
    os: toRows(osGroups.map((g) => ({ key: g.os, count: g._count._all })), views, (k) => k),
    browsers: toRows(browserGroups.map((g) => ({ key: g.browser, count: g._count._all })), views, (k) => k),
  };
}

export type Extras = {
  /** Views by weekday (0 = Monday) × hour, in the owner's time zone. */
  heatmap: number[][];
  /** Clicks per (source, block): the source is the one the visitor arrived from that day. */
  sourceLinks: { source: string; blockId: string; clicks: number }[];
  /** Clicks per block in the previous period of the same length (empty for "all"). */
  previousLinkClicks: Record<string, number>;
};

/**
 * What the insight sentences and the heatmap need, beyond getAnalytics. Aggregated in SQL. A click's source is found
 * by the visitor's first view that day (same daily visitorHash), so no extra tracking is stored.
 */
export async function getAnalyticsExtras(profile: { id: string; timezone: string }, range: Range): Promise<Extras> {
  const { from, prevFrom } = periodOf(range);
  const since = from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty;
  const [cells, sourceLinks, previous] = await Promise.all([
    db.$queryRaw<{ dow: number; hour: number; views: number }[]>(Prisma.sql`
      SELECT extract(isodow FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${profile.timezone})::int - 1 AS dow,
             extract(hour FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${profile.timezone})::int AS hour,
             count(*)::int AS views
      FROM "event" WHERE "profileId" = ${profile.id} AND type = 'VIEW' ${since}
      GROUP BY 1, 2`),
    db.$queryRaw<{ source: string; blockId: string; clicks: number }[]>(Prisma.sql`
      WITH arrivals AS (
        SELECT DISTINCT ON ("visitorHash") "visitorHash", coalesce("utmSource", "referrerHost", 'direct') AS source
        FROM "event" WHERE "profileId" = ${profile.id} AND type = 'VIEW' ${since}
        ORDER BY "visitorHash", "createdAt"
      )
      SELECT a.source, c."blockId", count(*)::int AS clicks
      FROM "event" c JOIN arrivals a ON a."visitorHash" = c."visitorHash"
      WHERE c."profileId" = ${profile.id} AND c.type = 'CLICK' AND c."blockId" IS NOT NULL ${from ? Prisma.sql`AND c."createdAt" >= ${from}` : Prisma.empty}
      GROUP BY 1, 2`),
    prevFrom && from
      ? db.event.groupBy({ by: ["blockId"], where: { profileId: profile.id, type: "CLICK", blockId: { not: null }, createdAt: { gte: prevFrom, lt: from } }, _count: { _all: true } })
      : Promise.resolve([]),
  ]);
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const c of cells) if (heatmap[c.dow]) heatmap[c.dow]![c.hour] = c.views;
  return {
    heatmap,
    sourceLinks,
    previousLinkClicks: Object.fromEntries(previous.flatMap((g) => (g.blockId ? [[g.blockId, g._count._all]] : []))),
  };
}

/** Blocks a visitor can tap (or copy from): each tap is a CLICK event on the block. */
const CLICKABLE: BlockType[] = ["LINK", "IMAGE", "PRODUCT", "WHATSAPP", "CONTACT", "SUPPORT"];

// Block.data is JSON; only these string fields are read, and missing ones are fine (unfinished drafts).
const draftOf = (data: unknown) => (data ?? {}) as Partial<Record<"title" | "alt" | "url" | "name" | "urlLabel", string>>;

/** How a block is named in statistics, also for unfinished drafts. */
export function blockLabel(type: BlockType, data: unknown): string {
  const d = draftOf(data);
  switch (type) {
    case "IMAGE":
      return d.title || d.alt || "—";
    case "WHATSAPP":
      return d.title || "WhatsApp";
    case "CONTACT":
      return d.name || "—";
    case "SUPPORT":
      return d.urlLabel || d.name || "—";
    default:
      return d.title || "—";
  }
}

/**
 * Clicks per block for each of the last 7 days in the owner's time zone (oldest first), for the editor's
 * sparklines. One grouped query; blocks without clicks are absent.
 */
export async function getBlockSparklines(profile: { id: string; timezone: string }, now = new Date()): Promise<Record<string, number[]>> {
  const from = new Date(now.getTime() - 7 * 86_400_000);
  const rows = await db.$queryRaw<{ blockId: string; day: string; clicks: number }[]>(Prisma.sql`
    SELECT "blockId", to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${profile.timezone}), 'YYYY-MM-DD') AS day,
           count(*)::int AS clicks
    FROM "event"
    WHERE "profileId" = ${profile.id} AND type = 'CLICK' AND "blockId" IS NOT NULL AND "createdAt" >= ${from}
    GROUP BY 1, 2`);
  const days = Array.from({ length: 7 }, (_, i) => dayIn(new Date(now.getTime() - (6 - i) * 86_400_000), profile.timezone));
  const out: Record<string, number[]> = {};
  for (const row of rows) {
    const index = days.indexOf(row.day);
    if (index < 0) continue;
    (out[row.blockId] ??= Array.from({ length: 7 }, () => 0))[index] = row.clicks;
  }
  return out;
}

/** "YYYY-MM-DD" of an instant in a time zone. */
const dayIn = (date: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/** Continuous day axis in the owner's time zone: days without events are zeros, not gaps. */
function fillDays(points: DayPoint[], range: Range, timeZone: string, now = new Date()): DayPoint[] {
  if (points.length === 0 && range === "all") return [];
  const byDay = new Map(points.map((p) => [p.day, p]));
  const today = dayIn(now, timeZone);
  const first = range === "all" ? points[0]!.day : dayIn(new Date(now.getTime() - (DAYS[range] - 1) * 86_400_000), timeZone);
  const out: DayPoint[] = [];
  // Walk calendar days as UTC dates; only the labels matter here, not the instants.
  for (let d = new Date(`${first}T00:00:00Z`); ; d = new Date(d.getTime() + 86_400_000)) {
    const day = d.toISOString().slice(0, 10);
    out.push(byDay.get(day) ?? { day, views: 0, clicks: 0 });
    if (day >= today) break;
  }
  return out;
}
