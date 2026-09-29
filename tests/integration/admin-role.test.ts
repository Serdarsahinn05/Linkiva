import { afterAll, describe, expect, it } from "vitest";

// The real Better Auth: nothing a visitor sends to its endpoints can make them staff.
const { db } = await import("@/lib/db");
const { auth } = await import("@/lib/auth");

const email = `role-${Date.now().toString(36)}@example.com`;

afterAll(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
});

describe("the staff role", () => {
  it("cannot be chosen at sign-up", async () => {
    // A hand-made request with an extra field (held in a variable, so TypeScript lets the extra field through too).
    const body = { email, password: "correct-horse-1", name: "x", role: "ADMIN" };
    await auth.api.signUpEmail({ body }).catch(() => undefined);
    const user = await db.user.findUnique({ where: { email }, select: { role: true } });
    expect(user?.role).toBe("USER");
  });
});
