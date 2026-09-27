"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { verifyUnsubscribeToken } from "./token";

type Result = { ok: true } | { ok: false; error: "invalid" | "unauthorized" | "unknown" };

/** Settings → Notifications: the owner's own switch. */
export async function setWeeklyDigest(on: boolean): Promise<Result> {
  const parsed = z.boolean().safeParse(on);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const user = await requireUser();
    const { count } = await db.profile.updateMany({ where: { userId: user.id }, data: { weeklyDigest: parsed.data } });
    return count ? { ok: true } : { ok: false, error: "invalid" };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    console.error("weekly digest setting failed", error);
    return { ok: false, error: "unknown" };
  }
}

/**
 * The mail's opt-out page, without a session: the signed token is the only authority, and it can only turn the
 * summary off. An unknown profile answers the same as a known one (nothing to leak).
 */
export async function unsubscribeWithToken(token: string): Promise<Result> {
  const profileId = verifyUnsubscribeToken(token);
  if (!profileId) return { ok: false, error: "invalid" };
  try {
    await db.profile.updateMany({ where: { id: profileId }, data: { weeklyDigest: false } });
    return { ok: true };
  } catch (error) {
    console.error("digest unsubscribe failed", error);
    return { ok: false, error: "unknown" };
  }
}
