import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily deletion of records that have outlived their purpose, so the retention periods in the privacy notice
 * (features/legal/privacy.ts → "saklama") are what the database actually does:
 * - sign-in/sign-up rate-limit counters (keyed by IP; every window is at most ten minutes) after a day,
 * - the app's own rate counters (hashed keys, lib/ratelimit.ts) once their window has ended,
 * - expired email verification, password reset and pending two-step sign-in records,
 * - past usernames whose 30-day redirect has ended (they stop redirecting at expiresAt already; this removes the row).
 * Sessions are kept until they are ended or the account is deleted, as the notice says.
 */
export async function runCleanup(now = new Date()) {
  const [rateLimits, rateCounters, verifications, usernames] = await db.$transaction([
    db.rateLimit.deleteMany({ where: { lastRequest: { lt: BigInt(now.getTime() - DAY_MS) } } }),
    db.rateCounter.deleteMany({ where: { resetAt: { lte: now } } }),
    db.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.usernameHistory.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);
  return { rateLimits: rateLimits.count, rateCounters: rateCounters.count, verifications: verifications.count, usernames: usernames.count };
}
