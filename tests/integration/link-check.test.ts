import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Outgoing mail is recorded instead of sent; a test can make the next batch fail.
const outbox = vi.hoisted(() => ({ batches: [] as { to: string; subject: string; text: string }[][], failNext: false }));
vi.mock("@/lib/mail/send", () => ({
  sendBatch: async (_kind: string, mails: { to: string; subject: string; text: string }[]) => {
    if (outbox.failNext) {
      outbox.failNext = false;
      throw new Error("provider down");
    }
    if (mails.length) outbox.batches.push(mails);
  },
}));

const { db } = await import("@/lib/db");
const { runLinkCheck } = await import("@/features/link-check/check");
const { getEditorData } = await import("@/features/editor/queries");
const { probeUrl } = await import("@/lib/link-preview");
type Probe = import("@/lib/link-preview").Probe;

const suffix = Date.now().toString(36);
const userId = `lc-${suffix}`;
let profileId = "";
const blocks: Record<"dead" | "alive" | "mail" | "hidden" | "private", string> = { dead: "", alive: "", mail: "", hidden: "", private: "" };
const DAY = 24 * 3_600_000;
const day = (n: number) => new Date(Date.now() + n * DAY);

/** A fake network: the dead link fails, everything else answers. Records every address asked for. */
const asked: string[] = [];
const fakeProbe = async (url: string): Promise<Probe> => {
  asked.push(url);
  return url.includes("dead") ? { outcome: "broken", status: 404 } : { outcome: "ok", status: 200 };
};
const check = (blockId: string) => db.linkCheck.findUnique({ where: { blockId } });

beforeAll(async () => {
  const user = await db.user.create({
    data: { id: userId, name: userId, email: `${userId}@example.com`, emailVerified: true, profile: { create: { username: userId, locale: "en" } } },
    include: { profile: true },
  });
  profileId = user.profile!.id;
  const make = (position: number, type: "LINK" | "SUPPORT", data: object, isVisible = true) =>
    db.block.create({ data: { profileId, type, position, data, isVisible } }).then((b) => b.id);
  blocks.dead = await make(0, "LINK", { title: "Old shop", url: "https://dead.example.com/shop" });
  blocks.alive = await make(1, "LINK", { title: "Blog", url: "https://example.com/blog" });
  blocks.mail = await make(2, "LINK", { title: "Write me", url: "mailto:me@example.com" });
  blocks.hidden = await make(3, "LINK", { title: "Draft", url: "https://dead.example.com/draft" }, false);
  blocks.private = await make(4, "SUPPORT", { name: "Router", url: "http://localhost/admin" });
});

beforeEach(async () => {
  outbox.batches = [];
  outbox.failNext = false;
  asked.length = 0;
  await db.linkCheck.deleteMany({ where: { blockId: { in: Object.values(blocks) } } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("runLinkCheck", () => {
  it("flags a link only after two failed days in a row, and mails its owner once", async () => {
    const first = await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(0) });
    // Hidden blocks are not tried; mailto is not a web address, so it is not asked for either.
    expect(first).toMatchObject({ checked: 4, ok: 2, broken: 1, skipped: 1, mailed: 0 });
    expect(asked.sort()).toEqual(["http://localhost/admin", "https://dead.example.com/shop", "https://example.com/blog"]);
    expect(await check(blocks.dead)).toMatchObject({ status: "BROKEN", failCount: 1 });
    expect(await check(blocks.hidden)).toBeNull();
    expect((await getEditorData(userId))!.linkIssues).toEqual({});

    // Same day again (a second cron run): nothing is tried twice.
    expect((await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(0) })).checked).toBe(0);

    const second = await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(1) });
    expect(second).toMatchObject({ broken: 1, mailed: 1 });
    expect(await check(blocks.dead)).toMatchObject({ status: "BROKEN", failCount: 2 });
    const mails = outbox.batches.flat();
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({ to: `${userId}@example.com` });
    expect(mails[0]!.subject).toMatch(/not opening/);
    expect(mails[0]!.text).toContain("Old shop: https://dead.example.com/shop");
    expect(Object.keys((await getEditorData(userId))!.linkIssues)).toEqual([blocks.dead]);

    // Still broken the next day: no second mail.
    expect((await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(2) })).mailed).toBe(0);
    expect(outbox.batches.flat()).toHaveLength(1);
  });

  it("starts over when the link works again or its address changes", async () => {
    await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(0) });
    await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(1) });
    expect(await check(blocks.dead)).toMatchObject({ failCount: 2 });

    await db.block.update({ where: { id: blocks.dead }, data: { data: { title: "Old shop", url: "https://example.com/new-shop" } } });
    try {
      // The editor stops flagging a block whose address changed, before the next check.
      expect((await getEditorData(userId))!.linkIssues).toEqual({});
      await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(2) });
      expect(await check(blocks.dead)).toMatchObject({ status: "OK", failCount: 0, notifiedAt: null, url: "https://example.com/new-shop" });
    } finally {
      await db.block.update({ where: { id: blocks.dead }, data: { data: { title: "Old shop", url: "https://dead.example.com/shop" } } });
    }
  });

  it("releases the mail claim when the provider refuses the batch", async () => {
    await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(0) });
    outbox.failNext = true;
    expect((await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(1) })).mailed).toBe(0);
    expect((await check(blocks.dead))?.notifiedAt).toBeNull();
    expect((await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(2) })).mailed).toBe(1);
  });

  it("stores a private network address as not judged, never as broken (real probe)", async () => {
    // The real guard for the private block; the public ones stay on the fake network (no internet in tests).
    const probe = (url: string) => (url.includes("localhost") ? probeUrl(url) : fakeProbe(url));
    for (const n of [0, 1, 2]) await runLinkCheck({ profileIds: [profileId], probe, now: day(n) });
    expect(await check(blocks.private)).toMatchObject({ status: null, failCount: 0, notifiedAt: null });
    expect(Object.keys((await getEditorData(userId))!.linkIssues)).toEqual([blocks.dead]);
  });

  it("only reads the caller's own blocks in the editor", async () => {
    await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(0) });
    await runLinkCheck({ profileIds: [profileId], probe: fakeProbe, now: day(1) });
    const other = await db.user.create({ data: { id: `${userId}-o`, name: "o", email: `${userId}-o@example.com`, profile: { create: { username: `${userId}-o` } } } });
    try {
      expect((await getEditorData(other.id))!.linkIssues).toEqual({});
    } finally {
      await db.user.delete({ where: { id: other.id } });
    }
  });
});
