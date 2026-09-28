import { afterAll, describe, expect, it } from "vitest";

const { db } = await import("@/lib/db");
const { runCleanup } = await import("@/features/maintenance/cleanup");

// The clean-up runs against a fixed "now" in the past so it can only touch the rows this file creates; other test
// files share the database and keep their own expired rows in the present.
const NOW = new Date("2001-06-01T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const suffix = Date.now().toString(36);
const key = (s: string) => `cleanup-${s}-${suffix}`;
const userId = key("user");

afterAll(async () => {
  await db.rateLimit.deleteMany({ where: { key: { startsWith: `cleanup-` } } });
  await db.verification.deleteMany({ where: { identifier: { startsWith: `cleanup-` } } });
  await db.user.deleteMany({ where: { id: userId } });
});

describe("daily clean-up", () => {
  it("deletes only records past their retention period", async () => {
    await db.rateLimit.createMany({
      data: [
        { id: key("rl-old"), key: key("rl-old"), count: 3, lastRequest: BigInt(NOW.getTime() - 25 * HOUR) },
        { id: key("rl-new"), key: key("rl-new"), count: 3, lastRequest: BigInt(NOW.getTime() - HOUR) },
      ],
    });
    await db.verification.createMany({
      data: [
        { id: key("v-old"), identifier: key("v-old"), value: "x", expiresAt: new Date(NOW.getTime() - HOUR) },
        { id: key("v-new"), identifier: key("v-new"), value: "x", expiresAt: new Date(NOW.getTime() + HOUR) },
      ],
    });
    const profile = await db.profile.create({
      data: { username: key("now"), user: { create: { id: userId, name: userId, email: `${userId}@example.com` } } },
    });
    await db.usernameHistory.createMany({
      data: [
        { username: key("gone"), profileId: profile.id, expiresAt: new Date(NOW.getTime() - HOUR) },
        { username: key("kept"), profileId: profile.id, expiresAt: new Date(NOW.getTime() + HOUR) },
      ],
    });

    const result = await runCleanup(NOW);

    expect(result).toEqual({ rateLimits: 1, verifications: 1, usernames: 1 });
    expect((await db.rateLimit.findMany({ where: { key: { startsWith: `cleanup-rl-` } } })).map((r) => r.key)).toEqual([key("rl-new")]);
    expect((await db.verification.findMany({ where: { identifier: { startsWith: `cleanup-v-` } } })).map((v) => v.identifier)).toEqual([key("v-new")]);
    expect((await db.usernameHistory.findMany({ where: { profileId: profile.id } })).map((u) => u.username)).toEqual([key("kept")]);
  });
});
