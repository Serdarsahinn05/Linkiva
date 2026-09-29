"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { db } from "@/lib/db";
import { sendMailQuietly } from "@/lib/mail/send";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { site } from "@/lib/site";
import { THEME_COOKIE } from "@/lib/theme-preference";
import { profileTag } from "@/features/profile/public";
import { restoreAccount as restore, scheduleDeletion } from "./deletion";

const YEAR = 60 * 60 * 24 * 365;

/** Interface preferences live in cookies so the root layout can apply them before first paint. */
export async function setThemePreference(value: string) {
  const parsed = z.enum(["light", "dark", "system"]).safeParse(value);
  if (!parsed.success) return;
  const jar = await cookies();
  if (parsed.data === "system") jar.delete(THEME_COOKIE);
  else jar.set(THEME_COOKIE, parsed.data, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

export async function setLocalePreference(value: string) {
  const parsed = z.enum(locales).safeParse(value);
  if (!parsed.success) return;
  (await cookies()).set(LOCALE_COOKIE, parsed.data, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

export type DeleteAccountResult = { ok: true } | { ok: false; error: "unauthorized" | "confirm" | "unknown" };

/**
 * Deletes the account after a waiting period (features/account/deletion.ts): the page goes offline and every session
 * ends now; signing in within ACCOUNT_DELETE_DAYS brings it all back, after that the daily cron erases it.
 * The caller must type their username to confirm.
 */
export async function deleteAccount(confirmation: string): Promise<DeleteAccountResult> {
  try {
    const user = await requireUser();
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { username: true } });
    const expected = profile?.username ?? user.email;
    if (typeof confirmation !== "string" || confirmation.trim().toLowerCase() !== expected.toLowerCase()) return { ok: false, error: "confirm" };

    const { username } = await scheduleDeletion(user.id);
    if (username) updateTag(profileTag(username));
    const locale = (await cookies()).get(LOCALE_COOKIE)?.value === "en" ? "en" : "tr";
    await sendMailQuietly({ to: user.email, kind: "accountDeletionScheduled", locale, url: `${site.url}/login` });
    return { ok: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    console.error("deleteAccount failed", error);
    return { ok: false, error: "unknown" };
  }
}

/** Cancels the signed-in user's own pending deletion and puts the page back as it was. */
export async function restoreDeletedAccount(): Promise<{ ok: boolean }> {
  try {
    const user = await requireUser();
    const restored = await restore(user.id);
    if (restored?.username) updateTag(profileTag(restored.username));
    return { ok: restored !== null };
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) console.error("restoreDeletedAccount failed", error);
    return { ok: false };
  }
}
