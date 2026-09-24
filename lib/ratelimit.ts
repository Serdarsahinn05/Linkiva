import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }) : null;
const limiters = new Map<string, Ratelimit>();

// Single-process fallback when Upstash is not configured (local development). Not shared across instances.
const memory = new Map<string, { count: number; reset: number }>();

/**
 * Sliding-window limit for public endpoints (subscribe, tracking beacon). Auth has its own limits.
 * Returns true when the request may proceed.
 */
export async function allow(name: string, key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (redis) {
    const id = `${name}:${max}:${windowSeconds}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`), prefix: `linkiva:${name}` });
      limiters.set(id, limiter);
    }
    try {
      return (await limiter.limit(key)).success;
    } catch (error) {
      // Never let the limiter take the feature down: fall back to the in-process window.
      console.error("rate limiter unavailable, using memory fallback", error);
    }
  }
  const now = Date.now();
  const slot = memory.get(`${name}:${key}`);
  if (!slot || slot.reset < now) {
    memory.set(`${name}:${key}`, { count: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  slot.count += 1;
  return slot.count <= max;
}

/** Client IP from the proxy headers (first x-forwarded-for hop), for rate-limit keys only; never stored. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
