import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, refresh: () => {}, unstable_cache: (fn: () => unknown) => fn }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => ({ raw: () => ["Özgeçmişim", "GitHub", "LinkedIn", "Projeler", "Son projem"] }),
}));

const { db } = await import("@/lib/db");
const { applyImport, readImport } = await import("@/features/import/actions");
const { addBlock, applyTemplate } = await import("@/features/editor/actions");
const { parseBlock } = await import("@/lib/validation/blocks");

const suffix = Date.now().toString(36);
const ids = { alice: `imp-a-${suffix}`, bob: `imp-b-${suffix}` };
const profileOf = (userId: string) => db.profile.findUniqueOrThrow({ where: { userId }, include: { blocks: { orderBy: { position: "asc" } }, socials: true } });

beforeAll(async () => {
  for (const id of Object.values(ids)) {
    await db.user.create({ data: { id, name: id, email: `${id}@example.com`, emailVerified: true, profile: { create: { username: id } } } });
  }
  const alice = await profileOf(ids.alice);
  // Alice already has a block, a name and an Instagram: the import must not overwrite them.
  await db.block.create({ data: { profileId: alice.id, type: "LINK", position: 0, data: { title: "Mine", url: "https://alice.example/" } } });
  await db.profile.update({ where: { id: alice.id }, data: { displayName: "Alice" } });
  await db.socialLink.create({ data: { profileId: alice.id, platform: "INSTAGRAM", handle: "alice", position: 0 } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("applying an import", () => {
  it("appends valid blocks, skips invalid ones, and only fills empty fields", async () => {
    actingUser.id = ids.alice;
    const result = await applyImport({
      displayName: "Someone else",
      bio: "Imported bio",
      items: [
        { kind: "LINK", title: "Blog", url: "blog.example.com" },
        { kind: "HEADER", text: "Music" },
        { kind: "EMBED", url: "https://youtu.be/dQw4w9WgXcQ" },
        { kind: "LINK", title: "Bad", url: "javascript:alert(1)" },
        { kind: "EMBED", url: "https://evil.example/player" },
      ],
      socials: [
        { platform: "INSTAGRAM", value: "https://instagram.com/other" },
        { platform: "GITHUB", value: "https://github.com/alice" },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.skipped).toBe(2);
    expect(result.data.displayName).toBeUndefined(); // Alice already had one.
    expect(result.data.bio).toBe("Imported bio");
    expect(result.data.socials).toEqual({ GITHUB: "alice" });

    const alice = await profileOf(ids.alice);
    expect(alice.displayName).toBe("Alice");
    expect(alice.blocks.map((b) => b.type)).toEqual(["LINK", "LINK", "HEADER", "EMBED"]);
    expect(alice.blocks[0]?.data).toEqual({ title: "Mine", url: "https://alice.example/" });
    expect(alice.blocks[1]?.data).toEqual({ title: "Blog", url: "https://blog.example.com/" });
    expect(alice.socials.find((s) => s.platform === "INSTAGRAM")?.handle).toBe("alice");
  });

  it("writes only to the caller's own profile", async () => {
    actingUser.id = ids.bob;
    const before = (await profileOf(ids.alice)).blocks.length;
    await applyImport({ items: [{ kind: "LINK", title: "Bob's", url: "https://bob.example/" }], socials: [] });
    expect((await profileOf(ids.alice)).blocks.length).toBe(before);
    expect((await profileOf(ids.bob)).blocks.map((b) => b.data)).toEqual([{ title: "Bob's", url: "https://bob.example/" }]);
  });

  it("rejects malformed payloads", async () => {
    actingUser.id = ids.bob;
    expect(await applyImport({ items: [{ kind: "IMAGE", src: "x" }], socials: [] })).toEqual({ ok: false, error: "invalid" });
    expect(await applyImport({ items: Array.from({ length: 101 }, () => ({ kind: "HEADER", text: "x" })), socials: [] })).toEqual({ ok: false, error: "invalid" });
  });
});

describe("GitHub repositories as project cards (Faz 12)", () => {
  it("adds valid projects to the caller's own page and skips ones with an unsafe address", async () => {
    actingUser.id = ids.bob;
    const result = await applyImport({
      items: [
        { kind: "PROJECT", title: "linkiva", desc: "Bio-link", repo: "https://github.com/bob/linkiva", url: "https://linkiva.space", tags: "next.js, next.js, postgres", stars: "12" },
        { kind: "PROJECT", title: "evil", repo: "javascript:alert(1)" },
      ],
      socials: [{ platform: "GITHUB", value: "bob" }],
    });
    expect(result).toMatchObject({ ok: true, data: { skipped: 1 } });
    const bob = await profileOf(ids.bob);
    const project = bob.blocks.find((b) => b.type === "PROJECT");
    // Tags are de-duplicated by the same schema the editor uses.
    expect(project?.data).toEqual({ title: "linkiva", desc: "Bio-link", repo: "https://github.com/bob/linkiva", url: "https://linkiva.space/", tags: "next.js, postgres", stars: "12" });
    expect(bob.socials.find((s) => s.platform === "GITHUB")?.handle).toBe("bob");
    expect((await profileOf(ids.alice)).blocks.some((b) => b.type === "PROJECT")).toBe(false);
  });

  it("reads only github.com user addresses, never a repository or another host", async () => {
    actingUser.id = ids.bob;
    expect(await readImport("https://github.com/bob/linkiva")).toEqual({ ok: false, error: "unsupported" });
    expect(await readImport("https://gitlab.com/bob")).toEqual({ ok: false, error: "unsupported" });
  });
});

describe("reading an import", () => {
  it("never fetches a host that is not allow-listed", async () => {
    actingUser.id = ids.bob;
    expect(await readImport("http://169.254.169.254/latest/meta-data")).toEqual({ ok: false, error: "unsupported" });
    expect(await readImport("https://example.com/someone")).toEqual({ ok: false, error: "unsupported" });
  });
});

describe("templates and prefilled blocks", () => {
  it("adds template links as unfinished drafts that never publish", async () => {
    actingUser.id = ids.bob;
    const result = await applyTemplate("student");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.map((b) => b.type)).toEqual(["LINK", "LINK", "LINK", "HEADER", "LINK"]);
    expect(result.data[0]?.data).toEqual({ title: "Özgeçmişim", url: "" });
    const links = result.data.filter((b) => b.type === "LINK");
    expect(links.every((b) => parseBlock(b.type, b.data) === null)).toBe(true);
    expect(await applyTemplate("nope")).toEqual({ ok: false, error: "invalid" });
  });

  it("accepts a prefill only for a complete link or embed", async () => {
    actingUser.id = ids.bob;
    const link = await addBlock("LINK", { title: "Site", url: "site.example.com" });
    expect(link.ok && link.data.data).toEqual({ title: "Site", url: "https://site.example.com/" });
    expect(await addBlock("LINK", { title: "x", url: "javascript:alert(1)" })).toEqual({ ok: false, error: "invalid" });
    expect(await addBlock("IMAGE", { src: "https://evil.example/a.png" })).toEqual({ ok: false, error: "invalid" });
    expect(await addBlock("EMBED", { url: "https://evil.example/player" })).toEqual({ ok: false, error: "invalid" });
  });
});
