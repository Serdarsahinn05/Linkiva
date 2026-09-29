import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: () => unknown) => fn }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }), cookies: async () => new Map() }));

const { db } = await import("@/lib/db");
const actions = await import("@/features/editor/actions");
const appearance = await import("@/features/appearance/actions");
const audience = await import("@/features/audience/actions");

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

  it("cannot resize someone else's block, and only to a size the type allows (grid layout)", async () => {
    expect(await actions.setBlockSize(aliceBlock, "SMALL")).toEqual({ ok: false, error: "notFound" });
    expect((await db.block.findUniqueOrThrow({ where: { id: aliceBlock } })).size).toBe("WIDE");
    expect(await actions.setBlockSize(bobBlock, "HUGE")).toEqual({ ok: false, error: "invalid" });
    expect(await actions.setBlockSize(bobBlock, "LARGE")).toEqual({ ok: true, data: undefined });
    expect((await db.block.findUniqueOrThrow({ where: { id: bobBlock } })).size).toBe("LARGE");
    const bob = await db.profile.findUniqueOrThrow({ where: { userId: ids.bob } });
    const header = await db.block.create({ data: { profileId: bob.id, type: "HEADER", position: 9, data: { text: "Başlık" } } });
    expect(await actions.setBlockSize(header.id, "SMALL")).toEqual({ ok: false, error: "invalid" });
    await db.block.delete({ where: { id: header.id } });
  });

  it("cannot point someone else's embed at a channel; only channel addresses are read", async () => {
    const alice = await db.profile.findUniqueOrThrow({ where: { userId: ids.alice } });
    const embed = await db.block.create({ data: { profileId: alice.id, type: "EMBED", position: 3, data: { url: "https://youtu.be/dQw4w9WgXcQ" } } });
    // Both are refused before any request leaves the server.
    expect(await actions.resolveLatestVideo(embed.id, "https://www.youtube.com/@linkiva")).toEqual({ ok: false, error: "notFound" });
    expect(await actions.resolveLatestVideo(bobBlock, "https://evil.example/@linkiva")).toEqual({ ok: false, error: "invalid" });
    expect(await actions.resolveLatestVideo(bobBlock, "https://www.youtube.com/@linkiva")).toEqual({ ok: false, error: "notFound" }); // a link, not an embed
    expect((await db.block.findUniqueOrThrow({ where: { id: embed.id } })).data).toEqual({ url: "https://youtu.be/dQw4w9WgXcQ" });
    await db.block.delete({ where: { id: embed.id } });
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

  it("sets the sensitive content warning only on its own link, and only to a known kind", async () => {
    expect(await actions.updateBlock(aliceBlock, { title: "Alice", url: "https://alice.example/", gate: "adult" })).toEqual({ ok: false, error: "notFound" });
    expect((await db.block.findUniqueOrThrow({ where: { id: aliceBlock } })).data).toEqual({ title: "Alice", url: "https://alice.example/" });
    await actions.updateBlock(bobBlock, { title: "Bob", url: "bob.example", gate: "spoiler" });
    expect((await db.block.findUniqueOrThrow({ where: { id: bobBlock } })).data).toEqual({ title: "Bob", url: "https://bob.example/", gate: "spoiler" });
    // An unknown kind keeps the block an unpublished draft instead of an ungated link.
    await actions.updateBlock(bobBlock, { title: "Bob", url: "bob.example", gate: "nsfw" });
    const { parseBlock } = await import("@/lib/validation/blocks");
    expect(parseBlock("LINK", (await db.block.findUniqueOrThrow({ where: { id: bobBlock } })).data)).toBeNull();
    // Turning it off stores no gate at all.
    await actions.updateBlock(bobBlock, { title: "Bob", url: "bob.example", gate: "" });
    expect((await db.block.findUniqueOrThrow({ where: { id: bobBlock } })).data).toEqual({ title: "Bob", url: "https://bob.example/" });
  });

  it("rejects unsafe urls as unfinished drafts that never publish", async () => {
    await actions.updateBlock(bobBlock, { title: "Bob", url: "javascript:alert(1)" });
    const { parseBlock } = await import("@/lib/validation/blocks");
    const block = await db.block.findUniqueOrThrow({ where: { id: bobBlock } });
    expect(parseBlock(block.type, block.data)).toBeNull();
  });
});

describe("image blocks only show the owner's own uploads", () => {
  const blob = (userId: string) => `https://store.public.blob.vercel-storage.com/u/${userId}/block/photo.webp`;

  it("rejects another user's file and any non-Blob host, accepts the owner's own", async () => {
    const added = await actions.addBlock("IMAGE");
    if (!added.ok) throw new Error("addBlock failed");
    const id = added.data.id;
    expect(await actions.updateBlock(id, { src: blob(ids.alice), alt: "x" })).toEqual({ ok: false, error: "invalid" });
    await actions.updateBlock(id, { src: "https://evil.example/u/x.webp" });
    const { parseBlock } = await import("@/lib/validation/blocks");
    expect(parseBlock("IMAGE", (await db.block.findUniqueOrThrow({ where: { id } })).data)).toBeNull();

    const own = await actions.updateBlock(id, { src: blob(ids.bob), alt: "Bob", title: "", url: "bob.example", w: "1200", h: "800" });
    expect(own.ok).toBe(true);
    expect(parseBlock("IMAGE", (await db.block.findUniqueOrThrow({ where: { id } })).data)).toMatchObject({ data: { src: blob(ids.bob), url: "https://bob.example/" } });
  });

  it("cannot restore a block pointing at someone else's file", async () => {
    const snapshot = { id: `img-${suffix}`, type: "IMAGE" as const, data: { src: blob(ids.alice) }, position: 5, isVisible: true, isHighlighted: false, size: "WIDE" as const, startsAt: null, endsAt: null };
    expect(await actions.restoreBlock(snapshot)).toEqual({ ok: false, error: "invalid" });
  });
});

describe("link preview cards", () => {
  it("cannot turn someone else's link into a card", async () => {
    expect(await actions.fetchLinkCard(aliceBlock, "https://example.com")).toEqual({ ok: false, error: "notFound" });
  });

  it("never fetches private addresses", async () => {
    for (const url of ["http://127.0.0.1/", "http://localhost:3000/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/"]) {
      const result = await actions.fetchLinkCard(bobBlock, url);
      expect(result.ok, url).toBe(false);
    }
  });

  it("rejects a card image from someone else's folder", async () => {
    const img = `https://store.public.blob.vercel-storage.com/u/${ids.alice}/block/card.png`;
    expect(await actions.updateBlock(bobBlock, { title: "Bob", url: "https://bob.example/", card: "1", img })).toEqual({ ok: false, error: "invalid" });
  });
});

describe("phase 3 actions stay inside the caller's profile", () => {
  it("cannot schedule someone else's block, and rejects an end before the start", async () => {
    expect(await actions.setBlockSchedule(aliceBlock, { startsAt: null, endsAt: "2030-01-01T00:00:00.000Z" })).toEqual({ ok: false, error: "notFound" });
    expect(await actions.setBlockSchedule(bobBlock, { startsAt: "2030-02-01T00:00:00.000Z", endsAt: "2030-01-01T00:00:00.000Z" })).toEqual({ ok: false, error: "invalid" });
    expect(await actions.setBlockSchedule(bobBlock, { startsAt: "2030-01-01T00:00:00.000Z", endsAt: null })).toEqual({ ok: true, data: undefined });
  });

  it("cannot use another user's blob as a background image", async () => {
    const foreign = `https://x.public.blob.vercel-storage.com/u/${ids.alice}/background.webp`;
    expect(await appearance.updateAppearance({ theme: "cam", appearance: { backgroundUrl: foreign }, showBranding: true })).toEqual({ ok: false, error: "invalid" });
    expect(await appearance.updateAppearance({ theme: "gece", appearance: { font: "mono" }, showBranding: false })).toEqual({ ok: true });
  });

  it("cannot remove someone else's subscriber", async () => {
    const alice = await db.profile.findUniqueOrThrow({ where: { userId: ids.alice } });
    const sub = await db.subscriber.create({ data: { profileId: alice.id, email: `sub-${suffix}@example.com` } });
    expect(await audience.removeSubscriber(sub.id)).toEqual({ ok: false });
    expect(await db.subscriber.count({ where: { id: sub.id } })).toBe(1);
  });
});

describe("bulk delete and its undo stay inside the caller's profile", () => {
  it("deletes only the caller's own blocks, ignoring someone else's ids", async () => {
    expect(await actions.deleteBlocks([aliceBlock])).toEqual({ ok: false, error: "notFound" });
    const bob = await db.profile.findUniqueOrThrow({ where: { userId: ids.bob } });
    const mine = await db.block.create({ data: { profileId: bob.id, type: "HEADER", position: 9, data: { text: "Bulk" } } });
    const result = await actions.deleteBlocks([mine.id, aliceBlock]);
    expect(result.ok && result.data.map((b) => b.id)).toEqual([mine.id]);
    expect(await db.block.count({ where: { id: aliceBlock } })).toBe(1);
    expect(await db.block.count({ where: { id: mine.id } })).toBe(0);

    // Undo recreates them on the caller's profile, with the same ids.
    if (!result.ok) throw new Error("deleteBlocks failed");
    const restored = await actions.restoreBlocks(result.data);
    expect(restored.ok && restored.data.map((b) => b.id)).toEqual([mine.id]);
    expect((await db.block.findUniqueOrThrow({ where: { id: mine.id } })).profileId).toBe(bob.id);
  });

  it("refuses an undo that would bring in someone else's file", async () => {
    const foreign = `https://store.public.blob.vercel-storage.com/u/${ids.alice}/block/photo.webp`;
    const snapshot = { id: `bulk-${suffix}`, type: "IMAGE" as const, data: { src: foreign }, position: 7, isVisible: true, isHighlighted: false, size: "WIDE" as const, startsAt: null, endsAt: null };
    expect(await actions.restoreBlocks([snapshot])).toEqual({ ok: false, error: "invalid" });
    expect(await db.block.count({ where: { id: snapshot.id } })).toBe(0);
  });
});
