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
