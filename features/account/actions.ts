"use server";

import { del, list } from "@vercel/blob";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { db } from "@/lib/db";
import { sendMailQuietly } from "@/lib/mail/send";
import { env } from "@/lib/env";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { THEME_COOKIE } from "@/lib/theme-preference";
import { userUploadPrefix } from "@/lib/uploads";
import { profileTag } from "@/features/profile/public";

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
 * Permanently deletes the account: uploaded files first (v1 left them behind), then the user row,
 * which cascades to sessions, accounts, profile, blocks, events and subscribers.
 * The caller must type their username to confirm.
 */
export async function deleteAccount(confirmation: string): Promise<DeleteAccountResult> {
  try {
    const user = await requireUser();
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { username: true } });
    const expected = profile?.username ?? user.email;
    if (typeof confirmation !== "string" || confirmation.trim().toLowerCase() !== expected.toLowerCase()) return { ok: false, error: "confirm" };

    if (env.BLOB_READ_WRITE_TOKEN) {
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: userUploadPrefix(user.id), cursor, token: env.BLOB_READ_WRITE_TOKEN });
        if (page.blobs.length) await del(page.blobs.map((b) => b.url), { token: env.BLOB_READ_WRITE_TOKEN });
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
    }

    await db.$transaction([db.verification.deleteMany({ where: { identifier: user.email } }), db.user.delete({ where: { id: user.id } })]);
    if (profile) updateTag(profileTag(profile.username));
    const locale = (await cookies()).get(LOCALE_COOKIE)?.value === "en" ? "en" : "tr";
    await sendMailQuietly({ to: user.email, kind: "accountDeleted", locale });
    return { ok: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    console.error("deleteAccount failed", error);
    return { ok: false, error: "unknown" };
  }
}
