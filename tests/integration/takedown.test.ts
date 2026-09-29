import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// A known Blob store, so "our upload" can be told apart from someone else's file.
const TOKEN = "vercel_blob_rw_teststore_secret";
process.env.BLOB_READ_WRITE_TOKEN = TOKEN;
const deleted = vi.hoisted(() => ({ urls: [] as string[] }));
vi.mock("@vercel/blob", () => ({ del: async (urls: string[]) => void deleted.urls.push(...urls) }));
vi.mock("@/lib/env", async (original) => {
  const actual = await original<typeof import("@/lib/env")>();
  return { ...actual, env: { ...actual.env, BLOB_READ_WRITE_TOKEN: TOKEN } };
});

const { db } = await import("@/lib/db");
const { removeBlockContent, removeProfileImages } = await import("@/features/moderation/takedown");

const suffix = Date.now().toString(36);
const userId = `td-${suffix}`;
const username = `td-${suffix}`;
const file = (owner: string, name: string) => `https://teststore.public.blob.vercel-storage.com/u/${owner}/${name}`;

beforeAll(async () => {
  await db.user.create({ data: { id: userId, name: userId, email: `${userId}@example.com`, emailVerified: true, profile: { create: { username } } } });
});
beforeEach(() => {
  deleted.urls = [];
});
afterAll(async () => {
  await db.user.deleteMany({ where: { id: userId } });
});

describe("content removal", () => {
  it("removes a block and only its owner's uploads", async () => {
    const profile = await db.profile.findUniqueOrThrow({ where: { username } });
    const block = await db.block.create({
      data: { profileId: profile.id, type: "IMAGE", position: 0, data: { src: file(userId, "block/photo.webp"), alt: "", w: "10", h: "10", other: file("someone-else", "x.webp") } },
    });

    expect(await removeBlockContent(block.id)).toEqual({ removedFiles: 1 });
    expect(deleted.urls).toEqual([file(userId, "block/photo.webp")]);
    expect(await db.block.findUnique({ where: { id: block.id } })).toBeNull();
    expect(await removeBlockContent(block.id)).toBeNull();
  });

  it("removes the profile photo and background, keeping the other appearance settings", async () => {
    const profile = await db.profile.update({
      where: { username },
      data: { avatarUrl: file(userId, "avatar.webp"), appearance: { layout: "grid", backgroundUrl: file(userId, "bg.webp") } },
    });

    expect(await removeProfileImages(profile.id)).toEqual({ removedFiles: 2 });
    expect(deleted.urls.sort()).toEqual([file(userId, "avatar.webp"), file(userId, "bg.webp")]);
    const after = await db.profile.findUniqueOrThrow({ where: { username } });
    expect(after.avatarUrl).toBeNull();
    expect(after.appearance).toEqual({ layout: "grid" });
    expect(await removeProfileImages(`nobody-${suffix}`)).toBeNull();
  });
});
