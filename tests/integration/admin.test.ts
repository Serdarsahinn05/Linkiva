import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Who is signed in (and on which session) is whatever this mock says; the TOTP check accepts only GOOD_CODE.
const current = vi.hoisted(() => ({ userId: "", sessionId: "" }));
const GOOD_CODE = "246810";
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => (current.userId ? { user: { id: current.userId }, session: { id: current.sessionId } } : null),
      verifyTOTP: async ({ body }: { body: { code: string } }) => {
        if (body.code !== GOOD_CODE) throw new Error("INVALID_CODE");
        return { token: "t" };
      },
    },
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { db } = await import("@/lib/db");
const { requireStaff, requireStaffPage } = await import("@/lib/admin");
const { confirmStepUp } = await import("@/features/admin/actions");

const suffix = Date.now().toString(36);
const ids = {
  user: `adm-u-${suffix}`,
  noTwoFactor: `adm-n-${suffix}`,
  moderator: `adm-m-${suffix}`,
  admin: `adm-a-${suffix}`,
  limited: `adm-l-${suffix}`,
  leaving: `adm-d-${suffix}`,
};
const session = (id: string) => `s-${id}`;
const signIn = (id: string) => Object.assign(current, { userId: id, sessionId: session(id) });
const auditFor = (id: string) => db.adminAudit.findMany({ where: { actorId: id }, orderBy: { id: "asc" }, select: { action: true } });

beforeAll(async () => {
  const setup = [
    [ids.user, "USER", true],
    [ids.noTwoFactor, "ADMIN", false],
    [ids.moderator, "MODERATOR", true],
    [ids.admin, "ADMIN", true],
    [ids.limited, "MODERATOR", true],
    [ids.leaving, "ADMIN", true],
  ] as const;
  for (const [id, role, twoFactorEnabled] of setup) {
    await db.user.create({
      data: {
        id,
        name: id,
        email: `${id}@example.com`,
        role,
        twoFactorEnabled,
        profile: { create: { username: id } },
        sessions: { create: { id: session(id), token: `t-${id}`, expiresAt: new Date(Date.now() + 86_400_000) } },
      },
    });
  }
  await db.accountDeletion.create({ data: { userId: ids.leaving, purgeAt: new Date(Date.now() + 86_400_000), wasPublished: true } });
});

afterAll(async () => {
  // Audit rows stay (append-only); they are labelled with this run's ids.
  await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  await db.$disconnect();
});

describe("who gets into the admin panel", () => {
  it("nobody signed out, and no normal user: both see a 404 and can call nothing", async () => {
    Object.assign(current, { userId: "", sessionId: "" });
    await expect(requireStaffPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(await confirmStepUp(GOOD_CODE)).toEqual({ ok: false, error: "notFound" });

    signIn(ids.user);
    await expect(requireStaffPage()).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(requireStaff("MODERATOR")).rejects.toMatchObject({ reason: "notFound" });
    expect(await confirmStepUp(GOOD_CODE)).toEqual({ ok: false, error: "notFound" });
    expect(await auditFor(ids.user)).toEqual([]);
  });

  it("an admin account waiting to be deleted is not staff", async () => {
    signIn(ids.leaving);
    await expect(requireStaff("MODERATOR")).rejects.toMatchObject({ reason: "notFound" });
  });

  it("staff without two-step verification see the page gate but no action works", async () => {
    signIn(ids.noTwoFactor);
    expect((await requireStaffPage()).twoFactor).toBe(false);
    await expect(requireStaff("MODERATOR")).rejects.toMatchObject({ reason: "twoFactor" });
    expect(await confirmStepUp(GOOD_CODE)).toEqual({ ok: false, error: "twoFactor" });
  });

  it("a moderator is not an admin", async () => {
    signIn(ids.moderator);
    await expect(requireStaffPage("ADMIN")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(requireStaff("ADMIN")).rejects.toMatchObject({ reason: "notFound" });
    expect((await requireStaff("MODERATOR")).role).toBe("MODERATOR");
  });
});

describe("step-up", () => {
  it("sensitive actions stay locked until the current code is confirmed, and every try is logged", async () => {
    signIn(ids.admin);
    await expect(requireStaff("ADMIN", { stepUp: true })).rejects.toMatchObject({ reason: "stepUp" });

    expect(await confirmStepUp("12ab56")).toEqual({ ok: false, error: "invalid" });
    expect(await confirmStepUp("111111")).toEqual({ ok: false, error: "invalid" });
    expect(await confirmStepUp(GOOD_CODE)).toEqual({ ok: true, data: undefined });

    const staff = await requireStaff("ADMIN", { stepUp: true });
    expect(staff.steppedUpUntil!.getTime()).toBeGreaterThan(Date.now() + 9 * 60_000);
    expect((await auditFor(ids.admin)).map((a) => a.action)).toEqual(["stepUpFailed", "stepUp"]);
  });

  it("holds for ten minutes only", async () => {
    signIn(ids.admin);
    await db.adminStepUp.update({ where: { sessionId: session(ids.admin) }, data: { verifiedAt: new Date(Date.now() - 11 * 60_000) } });
    await expect(requireStaff("ADMIN", { stepUp: true })).rejects.toMatchObject({ reason: "stepUp" });
  });

  it("belongs to the session it was confirmed on", async () => {
    signIn(ids.admin);
    await confirmStepUp(GOOD_CODE);
    Object.assign(current, { sessionId: "another-session" });
    await expect(requireStaff("ADMIN", { stepUp: true })).rejects.toMatchObject({ reason: "stepUp" });
  });

  it("allows five tries per fifteen minutes, then refuses even the right code", async () => {
    signIn(ids.limited);
    for (let i = 0; i < 5; i++) expect(await confirmStepUp("000000")).toEqual({ ok: false, error: "invalid" });
    expect(await confirmStepUp(GOOD_CODE)).toEqual({ ok: false, error: "tooMany" });
    await expect(requireStaff("MODERATOR", { stepUp: true })).rejects.toMatchObject({ reason: "stepUp" });
    expect((await auditFor(ids.limited)).at(-1)?.action).toBe("stepUpLimited");
  });
});

describe("the audit log", () => {
  it("cannot be changed, deleted or emptied, not even by the application's own connection", async () => {
    const row = await db.adminAudit.findFirstOrThrow({ where: { actorId: ids.admin } });
    await expect(db.adminAudit.update({ where: { id: row.id }, data: { reason: "rewritten" } })).rejects.toThrow(/append-only/);
    await expect(db.adminAudit.delete({ where: { id: row.id } })).rejects.toThrow(/append-only/);
    await expect(db.$executeRawUnsafe(`TRUNCATE "admin_audit"`)).rejects.toThrow(/append-only/);
    expect(await db.adminAudit.findUnique({ where: { id: row.id } })).not.toBeNull();
  });
});
