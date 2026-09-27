import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "", email: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id, email: actingUser.email }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, refresh: () => {}, unstable_cache: (fn: () => unknown) => fn }));

const { db } = await import("@/lib/db");
const { changeUsername, checkUsername } = await import("@/features/profile/actions");
const { getUsernameRedirect } = await import("@/features/profile/public");

const suffix = Date.now().toString(36);
const ids = { alice: `un-a-${suffix}`, bob: `un-b-${suffix}` };
const name = (s: string) => `${s}-${suffix}`;
const as = (id: string) => {
  actingUser.id = id;
  actingUser.email = `${id}@example.com`;
};
const profileOf = (userId: string) => db.profile.findUniqueOrThrow({ where: { userId } });

beforeAll(async () => {
  for (const id of Object.values(ids)) {
    await db.user.create({ data: { id, name: id, email: `${id}@example.com`, emailVerified: true, profile: { create: { username: id } } } });
  }
});

beforeEach(async () => {
  // Every test starts from the original names with no history.
  const profiles = await db.profile.findMany({ where: { userId: { in: Object.values(ids) } }, select: { id: true, userId: true } });
  await db.usernameHistory.deleteMany({ where: { profileId: { in: profiles.map((p) => p.id) } } });
  // Two passes: one profile may currently hold the other's original name.
  for (const p of profiles) await db.profile.update({ where: { id: p.id }, data: { username: `tmp-${p.userId}` } });
  for (const p of profiles) await db.profile.update({ where: { id: p.id }, data: { username: p.userId } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("changing a username", () => {
  it("moves the profile and keeps the old name redirecting", async () => {
    as(ids.alice);
    expect(await changeUsername(name("alice.new"))).toEqual({ ok: true, username: name("alice.new") });
    expect((await profileOf(ids.alice)).username).toBe(name("alice.new"));
    expect(await getUsernameRedirect(ids.alice)).toBe(name("alice.new"));
  });

  it("cannot take someone else's live name", async () => {
    as(ids.bob);
    const result = await changeUsername(ids.alice);
    expect(result).toMatchObject({ ok: false, error: "taken" });
    expect((await profileOf(ids.bob)).username).toBe(ids.bob);
  });

  it("cannot take someone else's past name while it still redirects", async () => {
    as(ids.alice);
    await changeUsername(name("alice.2"));
    as(ids.bob);
    expect(await checkUsername(ids.alice)).toMatchObject({ state: "taken" });
    expect(await changeUsername(ids.alice)).toMatchObject({ ok: false, error: "taken" });
    // The redirect still points at Alice.
    expect(await getUsernameRedirect(ids.alice)).toBe(name("alice.2"));
  });

  it("frees a past name once its redirect expired", async () => {
    as(ids.alice);
    await changeUsername(name("alice.3"));
    await db.usernameHistory.update({ where: { username: ids.alice }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getUsernameRedirect(ids.alice)).toBeNull();

    as(ids.bob);
    expect(await changeUsername(ids.alice)).toEqual({ ok: true, username: ids.alice });
    // Alice's stale row is gone; Bob's own old name is now in history instead.
    expect(await db.usernameHistory.findUnique({ where: { username: ids.alice } })).toBeNull();
    expect(await getUsernameRedirect(ids.bob)).toBe(ids.alice);
  });

  it("lets the owner go back to their own past name", async () => {
    as(ids.alice);
    await changeUsername(name("alice.4"));
    expect(await checkUsername(ids.alice)).toMatchObject({ state: "available" });
    expect(await changeUsername(ids.alice)).toEqual({ ok: true, username: ids.alice });
    // The live name never redirects to itself.
    expect(await db.usernameHistory.findUnique({ where: { username: ids.alice } })).toBeNull();
    expect(await getUsernameRedirect(name("alice.4"))).toBe(ids.alice);
  });

  it("allows at most two changes in 30 days", async () => {
    as(ids.bob);
    expect((await changeUsername(name("bob.1"))).ok).toBe(true);
    expect((await changeUsername(name("bob.2"))).ok).toBe(true);
    expect(await changeUsername(name("bob.3"))).toEqual({ ok: false, error: "limit" });
    expect((await profileOf(ids.bob)).username).toBe(name("bob.2"));
  });

  it("rejects reserved and malformed names", async () => {
    as(ids.bob);
    expect(await changeUsername("dashboard")).toEqual({ ok: false, error: "invalid" });
    expect(await changeUsername("a")).toEqual({ ok: false, error: "invalid" });
    expect(await changeUsername("-bad-")).toEqual({ ok: false, error: "invalid" });
  });

  it("does nothing for the current name", async () => {
    as(ids.bob);
    expect(await changeUsername(ids.bob)).toEqual({ ok: true, username: ids.bob });
    expect(await db.usernameHistory.count({ where: { profile: { userId: ids.bob } } })).toBe(0);
  });
});
