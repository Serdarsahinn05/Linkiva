"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { AdminDenied, audit, requireStaff, type AdminDenial } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { allow } from "@/lib/ratelimit";

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
