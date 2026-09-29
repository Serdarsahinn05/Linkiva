import { del, list } from "@vercel/blob";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { features } from "@/lib/features";
import { sendMailQuietly } from "@/lib/mail/send";
import { userUploadPrefix } from "@/lib/uploads";
import { removeDomain } from "@/lib/vercel-domains";
import { ACCOUNT_DELETE_DAYS } from "./policy";

// Not a "use server" module: nothing here checks who is asking. The actions (./actions.ts) and the daily cron call it.

const DAY_MS = 24 * 60 * 60 * 1000;
const PURGE_BATCH = 50;

/**
 * Starts the waiting period: the page goes offline at once (its published flag is kept for a restore), every session
 * ends, and the account is erased at purgeAt. Returns the profile's username (to invalidate its cache) and purgeAt.
 */
export async function scheduleDeletion(userId: string, now = new Date()) {
  const profile = await db.profile.findUnique({ where: { userId }, select: { username: true, isPublished: true } });
  const purgeAt = new Date(now.getTime() + ACCOUNT_DELETE_DAYS * DAY_MS);
  await db.$transaction([
    db.accountDeletion.upsert({
      where: { userId },
      create: { userId, requestedAt: now, purgeAt, wasPublished: profile?.isPublished ?? false },
      update: {},
    }),
    db.profile.updateMany({ where: { userId }, data: { isPublished: false } }),
    db.session.deleteMany({ where: { userId } }),
  ]);
  return { username: profile?.username ?? null, purgeAt };
}

/** Ends the waiting period and puts the page back as it was. Returns the username, or null when nothing was pending. */
export async function restoreAccount(userId: string) {
  const pending = await db.accountDeletion.findUnique({ where: { userId }, select: { wasPublished: true } });
  if (!pending) return null;
  const [, profile] = await db.$transaction([
    db.accountDeletion.delete({ where: { userId } }),
    // A page suspended by staff meanwhile stays offline.
    db.profile.updateMany({ where: { userId, suspendedAt: null }, data: { isPublished: pending.wasPublished } }),
  ]);
  if (profile.count === 0) return { username: null };
  const row = await db.profile.findUnique({ where: { userId }, select: { username: true } });
  return { username: row?.username ?? null };
}

/** The pending deletion of this user, if any (the dashboard shows the restore screen instead of the editor). */
export function pendingDeletion(userId: string) {
  return db.accountDeletion.findUnique({ where: { userId }, select: { purgeAt: true } });
}

/**
 * Erases one account for good: uploaded files and the custom domain first (v1 left files behind), then the user row,
 * which cascades to sessions, accounts, profile, blocks, events, subscribers and reports. `dueBy` (the daily run)
 * deletes the row only while its deletion is still due, so a restore that lands mid-run keeps the account.
 * Returns false when nothing was deleted. The caller sends the mail it needs (`mailTo`).
 */
export async function eraseAccount(userId: string, { dueBy }: { dueBy?: Date } = {}): Promise<{ mailTo: string; locale: "tr" | "en" } | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, profile: { select: { locale: true, customDomain: { select: { hostname: true } } } } } });
  if (!user) return null;
  if (env.BLOB_READ_WRITE_TOKEN) {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: userUploadPrefix(userId), cursor, token: env.BLOB_READ_WRITE_TOKEN });
      if (page.blobs.length) await del(page.blobs.map((b) => b.url), { token: env.BLOB_READ_WRITE_TOKEN });
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  // If Vercel cannot be reached the account still goes: without its row the proxy answers 404 for that name, and
  // the orphan is logged for manual removal.
  const hostname = user.profile?.customDomain?.hostname;
  if (hostname && features.domains) await removeDomain(hostname).catch((error) => console.error("custom domain removal failed", hostname, error));

  const [, gone] = await db.$transaction([
    db.verification.deleteMany({ where: { identifier: user.email } }),
    db.user.deleteMany({ where: dueBy ? { id: userId, deletion: { is: { purgeAt: { lte: dueBy } } } } : { id: userId } }),
  ]);
  return gone.count ? { mailTo: user.email, locale: user.profile?.locale === "en" ? "en" : "tr" } : null;
}

/** Daily: erases the accounts whose waiting period is over. */
export async function purgeDueAccounts(now = new Date()) {
  const due = await db.accountDeletion.findMany({ where: { purgeAt: { lte: now } }, select: { userId: true }, orderBy: { purgeAt: "asc" }, take: PURGE_BATCH });
  let purged = 0;
  for (const { userId } of due) {
    try {
      const erased = await eraseAccount(userId, { dueBy: now });
      if (!erased) continue;
      purged += 1;
      await sendMailQuietly({ to: erased.mailTo, kind: "accountDeleted", locale: erased.locale });
    } catch (error) {
      console.error("account purge failed", userId, error);
    }
  }
  return { purged };
}
