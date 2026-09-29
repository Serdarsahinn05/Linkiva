"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { AdminDenied, audit, requireStaff, type AdminDenial } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMailQuietly } from "@/lib/mail/send";
import { allow } from "@/lib/ratelimit";
import { site } from "@/lib/site";
import { eraseAccount } from "@/features/account/deletion";
import { removeBlockContent, removeProfileImages } from "@/features/moderation/takedown";
import { profileTag } from "@/features/profile/public";

export type AdminResult<T = undefined> = { ok: true; data: T } | { ok: false; error: AdminDenial | "invalid" | "tooMany" | "unknown" };

const fail = (error: Exclude<AdminResult, { ok: true }>["error"]): { ok: false; error: typeof error } => ({ ok: false, error });

/** Maps a refusal from lib/admin.ts to a result; anything else is logged and hidden behind "unknown". */
function denied(error: unknown, where: string) {
  if (error instanceof AdminDenied) return fail(error.reason);
  console.error(`admin action failed: ${where}`, error);
  return fail("unknown");
}

const idSchema = z.string().trim().min(1).max(40);
const noteSchema = z.string().trim().max(500).optional();

/**
 * Closes a report without acting on the page (it breaks no rule, or it is a duplicate). Reversible in effect (the
 * page is untouched), so no step-up; the note is kept in the audit log, not on the report.
 */
export async function dismissReport(id: string, note?: string): Promise<AdminResult> {
  try {
    const staff = await requireStaff("MODERATOR");
    const parsed = z.object({ id: idSchema, note: noteSchema }).safeParse({ id, note: note || undefined });
    if (!parsed.success) return fail("invalid");
    const report = await db.report.findUnique({ where: { id: parsed.data.id }, select: { status: true, profile: { select: { username: true } } } });
    if (!report || report.status !== "OPEN") return fail("notFound");
    const closed = await db.$transaction(async (tx) => {
      const { count } = await tx.report.updateMany({ where: { id: parsed.data.id, status: "OPEN" }, data: { status: "DISMISSED", resolvedAt: new Date(), resolvedBy: staff.userId } });
      // Logged only by whoever actually closed it (two staff on the same report: one line, not two).
      if (count) await audit(staff, { action: "reportDismissed", target: { type: "report", id: parsed.data.id, label: `@${report.profile.username}` }, reason: parsed.data.note }, tx);
      return count;
    });
    return closed ? { ok: true, data: undefined } : fail("notFound");
  } catch (error) {
    return denied(error, "dismissReport");
  }
}

const actionSchema = z.object({
  reportId: idSchema,
  action: z.enum(["removeBlock", "removeImages", "suspend"]),
  // A decision needs a reason: it is what the log (and an appeal) will be read against.
  reason: z.string().trim().min(3).max(500),
});

export type ReportAction = z.infer<typeof actionSchema>["action"];

const ownerOf = (profileId: string) =>
  db.profile.findUniqueOrThrow({ where: { id: profileId }, select: { username: true, locale: true, user: { select: { email: true } } } });

/**
 * Acts on an open report: removes the reported block (and its file), removes the page's photo and background, or
 * suspends the page. Sensitive: moderator, two-step verification and a code confirmed on this session. The content
 * goes first, then the report closes and the audit line is written; the owner gets an email either way.
 */
export async function actOnReport(input: { reportId: string; action: ReportAction; reason: string }): Promise<AdminResult> {
  try {
    const staff = await requireStaff("MODERATOR", { stepUp: true });
    const parsed = actionSchema.safeParse(input);
    if (!parsed.success) return fail("invalid");
    const { reportId, action, reason } = parsed.data;
    const report = await db.report.findUnique({ where: { id: reportId }, select: { status: true, blockId: true, profileId: true } });
    if (!report || report.status !== "OPEN") return fail("notFound");
    const owner = await ownerOf(report.profileId);

    let done: unknown;
    if (action === "removeBlock") done = report.blockId ? await removeBlockContent(report.blockId) : null;
    else if (action === "removeImages") done = await removeProfileImages(report.profileId);
    else done = await db.profile.update({ where: { id: report.profileId }, data: { suspendedAt: new Date(), isPublished: false } });
    if (!done) return fail("notFound");

    const logged = { removeBlock: "blockRemoved", removeImages: "imagesRemoved", suspend: "pageSuspended" } as const;
    await db.$transaction(async (tx) => {
      await tx.report.update({ where: { id: reportId }, data: { status: "ACTIONED", resolvedAt: new Date(), resolvedBy: staff.userId } });
      await audit(staff, { action: logged[action], target: { type: "profile", id: report.profileId, label: `@${owner.username}` }, reason, meta: { reportId, blockId: report.blockId } }, tx);
    });
    updateTag(profileTag(owner.username));
    await sendMailQuietly({ to: owner.user.email, kind: action === "suspend" ? "pageSuspended" : "contentRemoved", locale: owner.locale === "en" ? "en" : "tr", url: `${site.url}/dashboard` });
    return { ok: true, data: undefined };
  } catch (error) {
    return denied(error, "actOnReport");
  }
}

/** Lifts a suspension: the page is published again and its owner is told. Sensitive, with a reason, like suspending. */
export async function unsuspendPage(profileId: string, reason: string): Promise<AdminResult> {
  try {
    const staff = await requireStaff("MODERATOR", { stepUp: true });
    const parsed = z.object({ profileId: idSchema, reason: z.string().trim().min(3).max(500) }).safeParse({ profileId, reason });
    if (!parsed.success) return fail("invalid");
    const lifted = await db.$transaction(async (tx) => {
      const { count } = await tx.profile.updateMany({ where: { id: parsed.data.profileId, suspendedAt: { not: null } }, data: { suspendedAt: null, isPublished: true } });
      if (count) {
        const { username } = await tx.profile.findUniqueOrThrow({ where: { id: parsed.data.profileId }, select: { username: true } });
        await audit(staff, { action: "pageUnsuspended", target: { type: "profile", id: parsed.data.profileId, label: `@${username}` }, reason: parsed.data.reason }, tx);
      }
      return count;
    });
    if (!lifted) return fail("notFound");
    const owner = await ownerOf(parsed.data.profileId);
    updateTag(profileTag(owner.username));
    await sendMailQuietly({ to: owner.user.email, kind: "pageRestored", locale: owner.locale === "en" ? "en" : "tr", url: `${site.url}/${owner.username}` });
    return { ok: true, data: undefined };
  } catch (error) {
    return denied(error, "unsuspendPage");
  }
}

const label = (profile: { username: string } | null, id: string) => (profile ? `@${profile.username}` : id);

/**
 * Admin only: gives a user a staff role or takes it away. Never leaves the panel without an admin (the last admin
 * cannot step down or be demoted). A demoted member's step-ups end with the change.
 */
export async function setRole(userId: string, role: string, reason: string): Promise<AdminResult | { ok: false; error: "lastAdmin" }> {
  try {
    const staff = await requireStaff("ADMIN", { stepUp: true });
    const parsed = z.object({ userId: idSchema, role: z.enum(["USER", "MODERATOR", "ADMIN"]), reason: z.string().trim().min(3).max(500) }).safeParse({ userId, role, reason });
    if (!parsed.success) return fail("invalid");
    const target = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { role: true, profile: { select: { username: true } } } });
    if (!target) return fail("notFound");
    if (target.role === parsed.data.role) return { ok: true, data: undefined };
    const changed = await db.$transaction(async (tx) => {
      if (target.role === "ADMIN" && (await tx.user.count({ where: { role: "ADMIN" } })) <= 1) return false;
      await tx.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
      await tx.adminStepUp.deleteMany({ where: { session: { userId: parsed.data.userId } } });
      await audit(staff, { action: "roleSet", target: { type: "user", id: parsed.data.userId, label: label(target.profile, parsed.data.userId) }, reason: parsed.data.reason, meta: { from: target.role, to: parsed.data.role } }, tx);
      return true;
    });
    return changed ? { ok: true, data: undefined } : { ok: false, error: "lastAdmin" };
  } catch (error) {
    return denied(error, "setRole");
  }
}

/**
 * Admin only: erases an account now, without the 15-day wait, when its owner asked for it from the account's own
 * address. The admin types the username to confirm. Not for oneself (Settings does that) and not for another admin
 * (take the role away first). The audit line keeps the username, never the email.
 */
export async function eraseAccountNow(userId: string, confirmation: string, reason: string): Promise<AdminResult | { ok: false; error: "confirm" | "protected" }> {
  try {
    const staff = await requireStaff("ADMIN", { stepUp: true });
    const parsed = z.object({ userId: idSchema, reason: z.string().trim().min(3).max(500) }).safeParse({ userId, reason });
    if (!parsed.success || typeof confirmation !== "string") return fail("invalid");
    const target = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { role: true, profile: { select: { username: true } } } });
    if (!target) return fail("notFound");
    if (parsed.data.userId === staff.userId || target.role === "ADMIN") return { ok: false, error: "protected" };
    const name = target.profile?.username ?? parsed.data.userId;
    if (confirmation.trim().toLowerCase() !== name.toLowerCase()) return { ok: false, error: "confirm" };

    const erased = await eraseAccount(parsed.data.userId);
    if (!erased) return fail("notFound");
    await audit(staff, { action: "accountErased", target: { type: "user", id: parsed.data.userId, label: label(target.profile, parsed.data.userId) }, reason: parsed.data.reason });
    if (target.profile) updateTag(profileTag(target.profile.username));
    await sendMailQuietly({ to: erased.mailTo, kind: "accountErased", locale: erased.locale });
    return { ok: true, data: undefined };
  } catch (error) {
    return denied(error, "eraseAccountNow");
  }
}

/**
 * Step-up: the staff member's current two-step code unlocks sensitive actions on this session for a few minutes.
 * Better Auth checks the code but counts no failures for a signed-in session, so the attempts are limited here
 * (5 per 15 minutes) and every try, good or bad, is in the audit log.
 */
export async function confirmStepUp(code: string): Promise<AdminResult> {
  try {
    const staff = await requireStaff("MODERATOR");
    const parsed = z.string().regex(/^\d{6}$/).safeParse(typeof code === "string" ? code.replace(/\s/g, "") : code);
    if (!parsed.success) return fail("invalid");
    if (!(await allow("admin-step-up", staff.userId, 5, 15 * 60))) {
      await audit(staff, { action: "stepUpLimited" });
      return fail("tooMany");
    }
    const valid = await auth.api
      .verifyTOTP({ body: { code: parsed.data }, headers: await headers() })
      .then(() => true)
      .catch(() => false);
    if (!valid) {
      await audit(staff, { action: "stepUpFailed" });
      return fail("invalid");
    }
    const now = new Date();
    await db.$transaction([
      db.adminStepUp.upsert({ where: { sessionId: staff.sessionId }, create: { sessionId: staff.sessionId, verifiedAt: now }, update: { verifiedAt: now } }),
      audit(staff, { action: "stepUp" }),
    ]);
    return { ok: true, data: undefined };
  } catch (error) {
    return denied(error, "confirmStepUp");
  }
}
