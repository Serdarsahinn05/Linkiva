import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The acting user is whoever this mock says; next/cache is a no-op outside a request.
const actingUser = vi.hoisted(() => ({ id: "" }));
vi.mock("@/lib/session", () => ({
  requireUser: async () => ({ id: actingUser.id }),
  UnauthorizedError: class extends Error {},
}));
vi.mock("next/cache", () => ({ updateTag: () => {}, refresh: () => {}, unstable_cache: (fn: () => unknown) => fn }));

const { db } = await import("@/lib/db");
const { addBlock, deleteBlock, updateBlock } = await import("@/features/editor/actions");

const suffix = Date.now().toString(36);
const ids = { alice: `tr-a-${suffix}`, bob: `tr-b-${suffix}` };
const IBAN = "TR330006100519786457841326";
let aliceSupport = "";

beforeAll(async () => {
  for (const id of Object.values(ids)) {
    await db.user.create({ data: { id, name: id, email: `${id}@example.com`, emailVerified: true, profile: { create: { username: id } } } });
  }
  const alice = await db.profile.findUniqueOrThrow({ where: { userId: ids.alice } });
  aliceSupport = (await db.block.create({ data: { profileId: alice.id, type: "SUPPORT", position: 0, data: { name: "Alice", iban: IBAN } } })).id;
});

afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("contact and support blocks belong to their owner", () => {
  it("nobody else can swap the IBAN on someone's support block", async () => {
    actingUser.id = ids.bob;
    const attacker = "TR320010009999901234567890";
    expect(await updateBlock(aliceSupport, { name: "Alice", iban: attacker })).toEqual({ ok: false, error: "notFound" });
    expect(await deleteBlock(aliceSupport)).toEqual({ ok: false, error: "notFound" });
    const block = await db.block.findUniqueOrThrow({ where: { id: aliceSupport } });
    expect(block.data).toEqual({ name: "Alice", iban: IBAN });
  });

  it("the owner's edits are stored normalised once complete", async () => {
    actingUser.id = ids.alice;
    const result = await updateBlock(aliceSupport, { name: "Alice", iban: "tr33 0006 1005 1978 6457 8413 26", note: "Teşekkürler" });
    expect(result.ok && result.data.data).toEqual({ name: "Alice", iban: IBAN, note: "Teşekkürler" });
  });

  it("a pasted WhatsApp link can prefill a button, but only with a real number", async () => {
    actingUser.id = ids.bob;
    const ok = await addBlock("WHATSAPP", { phone: "905321234567", message: "Merhaba" });
    expect(ok.ok && ok.data.data).toEqual({ phone: "905321234567", message: "Merhaba" });
    expect(await addBlock("WHATSAPP", { phone: "javascript:alert(1)" })).toEqual({ ok: false, error: "invalid" });
    expect(await addBlock("CONTACT", { name: "x", email: "x@example.com" })).toEqual({ ok: false, error: "invalid" });
  });
});
