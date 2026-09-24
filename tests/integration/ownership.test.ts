import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));

const { db } = await import("@/lib/db");
const actions = await import("@/features/editor/actions");

const suffix = Date.now().toString(36);
const ids = { alice: `own-a-${suffix}`, bob: `own-b-${suffix}` };
let aliceBlock = "";
let bobBlock = "";

beforeAll(async () => {
  for (const [name, id] of Object.entries(ids)) {
    await db.user.create({
      data: { id, name, email: `${id}@example.com`, emailVerified: true, profile: { create: { username: id } } },
    });
  }
  const alice = await db.profile.findUniqueOrThrow({ where: { userId: ids.alice } });
  const bob = await db.profile.findUniqueOrThrow({ where: { userId: ids.bob } });
  aliceBlock = (await db.block.create({ data: { profileId: alice.id, type: "LINK", position: 0, data: { title: "Alice", url: "https://alice.example/" } } })).id;
  bobBlock = (await db.block.create({ data: { profileId: bob.id, type: "LINK", position: 0, data: { title: "Bob", url: "https://bob.example/" } } })).id;
  actingUser.id = ids.bob; // Bob is the attacker from here on.
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("editor actions only touch the caller's own profile (v1 bug S1)", () => {
  it("cannot rewrite someone else's link", async () => {
    const result = await actions.updateBlock(aliceBlock, { title: "Hacked", url: "https://evil.example/" });
    expect(result).toEqual({ ok: false, error: "notFound" });
    const block = await db.block.findUniqueOrThrow({ where: { id: aliceBlock } });
    expect(block.data).toEqual({ title: "Alice", url: "https://alice.example/" });
  });

  it("cannot hide, highlight or delete someone else's link", async () => {
    expect(await actions.setBlockFlags(aliceBlock, { isVisible: false })).toEqual({ ok: false, error: "notFound" });
    expect(await actions.deleteBlock(aliceBlock)).toEqual({ ok: false, error: "notFound" });
    const block = await db.block.findUniqueOrThrow({ where: { id: aliceBlock } });
    expect(block.isVisible).toBe(true);
  });

  it("cannot smuggle a foreign id into a reorder", async () => {
    expect(await actions.reorderBlocks([bobBlock, aliceBlock])).toEqual({ ok: false, error: "invalid" });
    expect(await actions.reorderBlocks([bobBlock])).toEqual({ ok: true, data: undefined });
  });

  it("still edits its own blocks, storing the normalised url", async () => {
    const result = await actions.updateBlock(bobBlock, { title: "Bob", url: "bob.example/new" });
    expect(result.ok).toBe(true);
    const block = await db.block.findUniqueOrThrow({ where: { id: bobBlock } });
    expect(block.data).toEqual({ title: "Bob", url: "https://bob.example/new" });
  });

  it("rejects unsafe urls as unfinished drafts that never publish", async () => {
    await actions.updateBlock(bobBlock, { title: "Bob", url: "javascript:alert(1)" });
    const { parseBlock } = await import("@/lib/validation/blocks");
    const block = await db.block.findUniqueOrThrow({ where: { id: bobBlock } });
    expect(parseBlock(block.type, block.data)).toBeNull();
  });
});
