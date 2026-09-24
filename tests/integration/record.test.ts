import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));

const { db } = await import("@/lib/db");
const { recordEvent } = await import("@/features/analytics/record");

const suffix = Date.now().toString(36);
const userId = `rec-${suffix}`;
let profile: { id: string; userId: string };
let blockId = "";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0";
const headers = (extra: Record<string, string> = {}) => new Headers({ "user-agent": UA, "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200)}`, ...extra });

beforeAll(async () => {
  const user = await db.user.create({
    data: { id: userId, name: "r", email: `${userId}@example.com`, emailVerified: true, profile: { create: { username: userId } } },
    include: { profile: true },
  });
  profile = { id: user.profile!.id, userId };
  blockId = (await db.block.create({ data: { profileId: profile.id, type: "LINK", position: 0, data: { title: "x", url: "https://example.com/" } } })).id;
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("recordEvent", () => {
  it("records concurrent identical clicks exactly once (race found by the production e2e run)", async () => {
    const h = headers();
    const outcomes = await Promise.all(Array.from({ length: 5 }, () => recordEvent({ type: "CLICK", profile, blockId, headers: h })));
    expect(outcomes.filter((o) => o === "recorded")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "duplicate")).toHaveLength(4);
    expect(await db.event.count({ where: { profileId: profile.id, type: "CLICK" } })).toBe(1);
  });

  it("drops bots and prefetches without writing", async () => {
    expect(await recordEvent({ type: "VIEW", profile, headers: new Headers({ "user-agent": "WhatsApp/2.24" }) })).toBe("bot");
    expect(await recordEvent({ type: "VIEW", profile, headers: headers({ "sec-purpose": "prefetch" }) })).toBe("prefetch");
    expect(await db.event.count({ where: { profileId: profile.id, type: "VIEW" } })).toBe(0);
  });

  it("counts different visitors separately", async () => {
    expect(await recordEvent({ type: "VIEW", profile, headers: headers({ "x-forwarded-for": "203.0.113.1" }) })).toBe("recorded");
    expect(await recordEvent({ type: "VIEW", profile, headers: headers({ "x-forwarded-for": "203.0.113.2" }) })).toBe("recorded");
    expect(await recordEvent({ type: "VIEW", profile, headers: headers({ "x-forwarded-for": "203.0.113.1" }) })).toBe("duplicate");
  });
});
