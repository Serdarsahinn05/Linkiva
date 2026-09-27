import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { site } from "@/lib/site";

// Domain-separated from every other use of the auth secret.
const sign = (profileId: string) => createHmac("sha256", env.BETTER_AUTH_SECRET).update(`weekly-digest-unsubscribe:${profileId}`).digest("base64url");

/** "<profileId>.<signature>": lets the mail's opt-out link work without a session. It never expires; it can only turn the summary off. */
export function unsubscribeToken(profileId: string): string {
  return `${profileId}.${sign(profileId)}`;
}

/** The profile id a token was signed for, or null when it was not signed by us. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const profileId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(profileId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? profileId : null;
}

/** The confirmation page linked in the mail (a GET must not unsubscribe: mail scanners follow links). */
export const unsubscribePageUrl = (profileId: string) => `${site.url}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(profileId))}`;

/** RFC 8058 one-click endpoint for the List-Unsubscribe header (POST only). */
export const unsubscribeOneClickUrl = (profileId: string) => `${site.url}/api/digest/unsubscribe?t=${encodeURIComponent(unsubscribeToken(profileId))}`;
