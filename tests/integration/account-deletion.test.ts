import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "", email: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id, email: actingUser.email }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => new Map() }));

const { db } = await import("@/lib/db");
const account = await import("@/features/account/actions");
const editor = await import("@/features/editor/actions");
const { purgeDueAccounts } = await import("@/features/account/deletion");

const DAY = 24 * 60 * 60 * 1000;
const suffix = Date.now().toString(36);
const ids = { alice: `del-a-${suffix}`, bob: `del-b-${suffix}` };
const actAs = (id: string) => Object.assign(actingUser, { id, email: `${id}@example.com` });

beforeAll(async () => {
  for (const id of Object.values(ids)) {
    await db.user.create({
      data: {
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: true,
        profile: { create: { username: id, isPublished: true } },
        sessions: { create: { id: `s-${id}`, token: `t-${id}`, expiresAt: new Date(Date.now() + DAY) } },
      },
    });
  }
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

const aliceProfile = () => db.profile.findUnique({ where: { userId: ids.alice }, select: { isPublished: true } });
const aliceDeletion = () => db.accountDeletion.findUnique({ where: { userId: ids.alice } });

describe("account deletion waits 15 days and can be restored", () => {
  it("needs the exact username", async () => {
    actAs(ids.alice);
    expect(await account.deleteAccount("someone-else")).toEqual({ ok: false, error: "confirm" });
    expect(await aliceDeletion()).toBeNull();
  });

  it("takes the page offline, ends the sessions and freezes the editor", async () => {
    actAs(ids.alice);
    const before = Date.now();
    expect(await account.deleteAccount(ids.alice)).toEqual({ ok: true });

    const pending = await aliceDeletion();
    expect(pending?.wasPublished).toBe(true);
    expect(pending!.purgeAt.getTime() - before).toBeGreaterThanOrEqual(15 * DAY - 1000);
    expect(pending!.purgeAt.getTime() - before).toBeLessThan(15 * DAY + 60_000);
    expect((await aliceProfile())?.isPublished).toBe(false);
    expect(await db.session.count({ where: { userId: ids.alice } })).toBe(0);
    // The page cannot be put back online around the restore.
    expect(await editor.updatePublishing({ isPublished: true, seoTitle: "", seoDescription: "" })).toEqual({ ok: false, error: "notFound" });
    expect((await aliceProfile())?.isPublished).toBe(false);
  });

  it("cannot be restored by someone else", async () => {
    actAs(ids.bob);
    expect(await account.restoreDeletedAccount()).toEqual({ ok: false });
    expect(await aliceDeletion()).not.toBeNull();
    expect(await db.accountDeletion.findUnique({ where: { userId: ids.bob } })).toBeNull();
  });

  it("comes back as it was when its owner restores it", async () => {
    actAs(ids.alice);
    expect(await account.restoreDeletedAccount()).toEqual({ ok: true });
    expect(await aliceDeletion()).toBeNull();
    expect((await aliceProfile())?.isPublished).toBe(true);
    // Nothing left to restore.
    expect(await account.restoreDeletedAccount()).toEqual({ ok: false });
  });

  it("an unpublished page stays unpublished after a restore", async () => {
    actAs(ids.alice);
    await db.profile.update({ where: { userId: ids.alice }, data: { isPublished: false } });
    await account.deleteAccount(ids.alice);
    await account.restoreDeletedAccount();
    expect((await aliceProfile())?.isPublished).toBe(false);
  });

  it("is erased by the daily run only once the waiting period is over", async () => {
    actAs(ids.alice);
    await account.deleteAccount(ids.alice);
    const requested = (await aliceDeletion())!.requestedAt.getTime();

    await purgeDueAccounts(new Date(requested + 14 * DAY));
    expect(await db.user.findUnique({ where: { id: ids.alice } })).not.toBeNull();

    await purgeDueAccounts(new Date(requested + 15 * DAY + 60_000));
    expect(await db.user.findUnique({ where: { id: ids.alice } })).toBeNull();
    expect(await db.profile.findUnique({ where: { username: ids.alice } })).toBeNull();
    // Bob never asked: untouched.
    expect(await db.user.findUnique({ where: { id: ids.bob } })).not.toBeNull();
  });
});
