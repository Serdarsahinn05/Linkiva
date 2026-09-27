import { db } from "@/lib/db";

const TTL_MS = 60_000;
const MAX_ENTRIES = 1000;
const cache = new Map<string, { username: string | null; expires: number }>();

/**
 * The profile a verified custom domain serves, for the proxy. Remembered per server instance for a minute (misses
 * too, so a stray host cannot hammer the database); a domain removed in Settings stops within that minute.
 */
export async function usernameForHost(hostname: string): Promise<string | null> {
  const hit = cache.get(hostname);
  if (hit && hit.expires > Date.now()) return hit.username;
  const row = await db.customDomain.findUnique({ where: { hostname }, select: { verifiedAt: true, profile: { select: { username: true } } } });
  const username = row?.verifiedAt ? row.profile.username : null;
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(hostname, { username, expires: Date.now() + TTL_MS });
  return username;
}
