import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says (a session-less call throws, as requireUser does).
const actingUser = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/session", () => {
  class UnauthorizedError extends Error {}
  return {
    requireUser: async () => {
      if (!actingUser.id) throw new UnauthorizedError();
      return { id: actingUser.id, email: `${actingUser.id}@example.com` };
    },
    UnauthorizedError,
  };
});
vi.mock("next/cache", () => ({ updateTag: () => {}, refresh: () => {}, unstable_cache: (fn: () => unknown) => fn }));
// Outgoing mail is recorded instead of sent; a test can make the next batch fail.
const outbox = vi.hoisted(() => ({ batches: [] as { to: string; subject: string; headers?: Record<string, string> }[][], failNext: false }));
vi.mock("@/lib/mail/send", () => ({
  sendBatch: async (_kind: string, mails: { to: string; subject: string; headers?: Record<string, string> }[]) => {
    if (outbox.failNext) {
      outbox.failNext = false;
      throw new Error("provider down");
    }
    if (mails.length) outbox.batches.push(mails);
  },
}));

const { db } = await import("@/lib/db");
const { runWeeklyDigest } = await import("@/features/digest/digest");
const { setWeeklyDigest, unsubscribeWithToken } = await import("@/features/digest/actions");
const { unsubscribeToken } = await import("@/features/digest/token");
const { POST: oneClick } = await import("@/app/api/digest/unsubscribe/route");

const suffix = Date.now().toString(36);
const ids = { busy: `dg-busy-${suffix}`, quiet: `dg-quiet-${suffix}`, unverified: `dg-unver-${suffix}`, other: `dg-other-${suffix}` };
const profileIds: Record<keyof typeof ids, string> = { busy: "", quiet: "", unverified: "", other: "" };
const all = () => Object.values(profileIds);
const profile = (key: keyof typeof ids) => db.profile.findUniqueOrThrow({ where: { id: profileIds[key] } });
const HOUR = 3_600_000;

beforeAll(async () => {
  for (const [key, id] of Object.entries(ids) as [keyof typeof ids, string][]) {
    const user = await db.user.create({
      data: { id, name: id, email: `${id}@example.com`, emailVerified: key !== "unverified", profile: { create: { username: id, locale: key === "busy" ? "en" : "tr" } } },
      include: { profile: true },
    });
    profileIds[key] = user.profile!.id;
  }
  // Visits in the last week for everyone except "quiet".
  const link = await db.block.create({ data: { profileId: profileIds.busy, type: "LINK", position: 0, data: { title: "Shop", url: "https://example.com/" } } });
  await db.event.createMany({
    data: [
      ...["busy", "unverified", "other"].flatMap((key) =>
        [1, 2, 3].map((h) => ({ profileId: profileIds[key as keyof typeof ids], type: "VIEW" as const, visitorHash: `v${h}`, createdAt: new Date(Date.now() - h * HOUR) })),
      ),
      { profileId: profileIds.busy, blockId: link.id, type: "CLICK" as const, visitorHash: "v1", createdAt: new Date(Date.now() - HOUR) },
    ],
  });
});

beforeEach(async () => {
  outbox.batches = [];
  outbox.failNext = false;
  actingUser.id = "";
  await db.profile.updateMany({ where: { id: { in: all() } }, data: { weeklyDigest: true, digestSentAt: null } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("runWeeklyDigest", () => {
  it("mails verified owners with visits, once per week", async () => {
    const first = await runWeeklyDigest({ profileIds: all() });
    expect(first).toEqual({ claimed: 3, sent: 2, noVisits: 1 });
    const mails = outbox.batches.flat();
    expect(mails.map((m) => m.to).sort()).toEqual([`${ids.busy}@example.com`, `${ids.other}@example.com`].sort());
    // In the owner's language, with a one-click opt-out header.
    expect(mails.find((m) => m.to.startsWith(ids.busy))?.subject).toMatch(/last week/);
    expect(mails[0]?.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(mails[0]?.headers?.["List-Unsubscribe"]).toContain("/api/digest/unsubscribe?t=");

    // Same week again (a second cron run, or a retry): nothing.
    expect(await runWeeklyDigest({ profileIds: all() })).toEqual({ claimed: 0, sent: 0, noVisits: 0 });
    expect(outbox.batches).toHaveLength(1);
    // A quiet profile was claimed too, so it is not recomputed every day.
    expect((await profile("quiet")).digestSentAt).not.toBeNull();
  });

  it("sends again the next week", async () => {
    const lastWeek = new Date(Date.now() - 8 * 24 * HOUR);
    await db.profile.updateMany({ where: { id: { in: all() } }, data: { digestSentAt: lastWeek } });
    expect((await runWeeklyDigest({ profileIds: all() })).sent).toBe(2);
  });

  it("does not mail two overlapping runs twice", async () => {
    const [a, b] = await Promise.all([runWeeklyDigest({ profileIds: all() }), runWeeklyDigest({ profileIds: all() })]);
    expect(a.sent + b.sent).toBe(2);
    expect(outbox.batches.flat()).toHaveLength(2);
  });

  it("skips owners who turned it off", async () => {
    await db.profile.update({ where: { id: profileIds.busy }, data: { weeklyDigest: false } });
    await runWeeklyDigest({ profileIds: all() });
    expect(outbox.batches.flat().map((m) => m.to)).toEqual([`${ids.other}@example.com`]);
  });

  it("releases the claims when the provider refuses the batch", async () => {
    outbox.failNext = true;
    await expect(runWeeklyDigest({ profileIds: all() })).rejects.toThrow("provider down");
    expect((await profile("busy")).digestSentAt).toBeNull();
    expect((await runWeeklyDigest({ profileIds: all() })).sent).toBe(2);
  });
});

describe("opting out", () => {
  it("works from the mail link without a session", async () => {
    expect(await unsubscribeWithToken(unsubscribeToken(profileIds.busy))).toEqual({ ok: true });
    expect((await profile("busy")).weeklyDigest).toBe(false);
    expect((await profile("other")).weeklyDigest).toBe(true);
  });

  it("refuses a forged token", async () => {
    const forged = `${profileIds.other}.${unsubscribeToken(profileIds.busy).split(".").pop()}`;
    expect(await unsubscribeWithToken(forged)).toEqual({ ok: false, error: "invalid" });
    expect((await profile("other")).weeklyDigest).toBe(true);
  });

  it("works as an RFC 8058 one-click POST", async () => {
    const token = encodeURIComponent(unsubscribeToken(profileIds.other));
    expect((await oneClick(new Request(`http://localhost/api/digest/unsubscribe?t=${token}`, { method: "POST" }))).status).toBe(200);
    expect((await profile("other")).weeklyDigest).toBe(false);
    expect((await oneClick(new Request("http://localhost/api/digest/unsubscribe?t=x.y", { method: "POST" }))).status).toBe(400);
  });

  it("settings switch changes only the caller's own profile and needs a session", async () => {
    expect(await setWeeklyDigest(false)).toEqual({ ok: false, error: "unauthorized" });
    actingUser.id = ids.busy;
    expect(await setWeeklyDigest(false)).toEqual({ ok: true });
    expect((await profile("busy")).weeklyDigest).toBe(false);
    expect((await profile("other")).weeklyDigest).toBe(true);
  });
});
