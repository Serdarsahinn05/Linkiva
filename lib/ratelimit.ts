import { createHash } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Fixed-window limit for public endpoints (subscribe, tracking beacon) and costly actions (import, domains, link card).
 * One atomic upsert per call in the shared database, so every serverless instance sees the same count. Sign-in and
 * sign-up have their own limits in Better Auth. Returns true when the request may proceed.
 */
export async function allow(name: string, key: string, max: number, windowSeconds: number): Promise<boolean> {
  // Hashed: the table never holds an IP address, only a counter per (limit, caller).
  const id = createHash("sha256").update(`${name}:${key}`).digest("hex");
  try {
    const [row] = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "rate_counter" ("key", "count", "resetAt")
      VALUES (${id}, 1, now() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_counter"."resetAt" <= now() THEN 1 ELSE "rate_counter"."count" + 1 END,
        "resetAt" = CASE WHEN "rate_counter"."resetAt" <= now() THEN now() + make_interval(secs => ${windowSeconds}) ELSE "rate_counter"."resetAt" END
      RETURNING "count"`;
    return (row?.count ?? 1) <= max;
  } catch (error) {
    // Never let the limiter take the feature down: a database hiccup lets this one request through.
    console.error("rate limiter unavailable", error);
    return true;
  }
}

/** Client IP from the proxy headers (first x-forwarded-for hop), for rate-limit keys only; never stored. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
