import { createHash } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const { db } = await import("@/lib/db");
const { allow } = await import("@/lib/ratelimit");

const name = `rl-test-${Date.now().toString(36)}`;
const hashed = (key: string) => createHash("sha256").update(`${name}:${key}`).digest("hex");

afterAll(async () => {
  await db.rateCounter.deleteMany({ where: { key: { in: [hashed("203.0.113.7"), hashed("203.0.113.8")] } } });
  await db.$disconnect();
});

describe("database rate limit", () => {
  it("lets max requests through per window, then refuses", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await allow(name, "203.0.113.7", 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });

  it("counts each caller on its own", async () => {
    expect(await allow(name, "203.0.113.8", 3, 60)).toBe(true);
  });

  it("stores no IP address, only a hash", async () => {
    const row = await db.rateCounter.findUnique({ where: { key: hashed("203.0.113.7") } });
    expect(row?.count).toBe(4);
    expect(await db.rateCounter.count({ where: { key: { contains: "203.0.113" } } })).toBe(0);
  });

  it("starts a new window once the old one has ended", async () => {
    await db.rateCounter.update({ where: { key: hashed("203.0.113.7") }, data: { resetAt: new Date(Date.now() - 1000) } });
    expect(await allow(name, "203.0.113.7", 3, 60)).toBe(true);
    expect((await db.rateCounter.findUnique({ where: { key: hashed("203.0.113.7") } }))?.count).toBe(1);
  });

  it("counts correctly under concurrent requests (one atomic upsert per call)", async () => {
    await db.rateCounter.deleteMany({ where: { key: hashed("203.0.113.7") } });
    const results = await Promise.all(Array.from({ length: 10 }, () => allow(name, "203.0.113.7", 5, 60)));
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});
