import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Each run reports from its own address, so the rate limit counters of earlier runs never get in the way.
const ip = vi.hoisted(() => ({ value: `198.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": ip.value }) }));

const { db } = await import("@/lib/db");
const { submitReport } = await import("@/features/moderation/actions");

const suffix = Date.now().toString(36);
const names = { page: `rep-p-${suffix}`, other: `rep-o-${suffix}`, hidden: `rep-h-${suffix}` };
let ownBlock = "";
let foreignBlock = "";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};
const reportsOn = (username: string) => db.report.findMany({ where: { profile: { username } }, orderBy: { createdAt: "asc" } });

beforeAll(async () => {
  for (const [key, username] of Object.entries(names)) {
    await db.user.create({ data: { id: username, name: username, email: `${username}@example.com`, profile: { create: { username, isPublished: key !== "hidden" } } } });
  }
  const page = await db.profile.findUniqueOrThrow({ where: { username: names.page } });
  const other = await db.profile.findUniqueOrThrow({ where: { username: names.other } });
  ownBlock = (await db.block.create({ data: { profileId: page.id, type: "LINK", position: 0, data: { title: "x", url: "https://x.example/" } } })).id;
  foreignBlock = (await db.block.create({ data: { profileId: other.id, type: "LINK", position: 0, data: { title: "y", url: "https://y.example/" } } })).id;
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(names) } } });
  await db.$disconnect();
});

describe("reporting a page", () => {
  it("files a report about a published page, with an optional email and block", async () => {
    const result = await submitReport({ status: "idle" }, form({ username: names.page, reason: "SCAM", details: "  Şifre istiyor  ", email: "Tanik@Example.com", blockId: ownBlock }));
    expect(result).toEqual({ status: "done" });
    const [report] = await reportsOn(names.page);
    expect(report).toMatchObject({ reason: "SCAM", details: "Şifre istiyor", email: "tanik@example.com", blockId: ownBlock, status: "OPEN" });
  });

  it("drops a block that belongs to another page instead of linking it", async () => {
    await db.report.deleteMany({ where: { profile: { username: names.page } } });
    expect(await submitReport({ status: "idle" }, form({ username: names.page, reason: "SPAM", blockId: foreignBlock }))).toEqual({ status: "done" });
    expect((await reportsOn(names.page))[0]?.blockId).toBeNull();
  });

  it("refuses an unpublished page and a made-up reason", async () => {
    expect(await submitReport({ status: "idle" }, form({ username: names.hidden, reason: "SPAM" }))).toEqual({ status: "error" });
    expect(await reportsOn(names.hidden)).toEqual([]);
    expect(await submitReport({ status: "idle" }, form({ username: names.other, reason: "BORING" }))).toEqual({ status: "invalid" });
  });

  it("pretends to accept a bot (filled honeypot) and stores nothing", async () => {
    expect(await submitReport({ status: "idle" }, form({ username: names.other, reason: "SPAM", website: "http://bot.example" }))).toEqual({ status: "done" });
    expect(await reportsOn(names.other)).toEqual([]);
  });

  it("takes at most two reports a day about the same page from one address", async () => {
    // Two went in above (the first test and the block test); the third is refused.
    expect(await submitReport({ status: "idle" }, form({ username: names.page, reason: "HATE" }))).toEqual({ status: "tooMany" });
    expect(await reportsOn(names.page)).toHaveLength(1);
  });
});
