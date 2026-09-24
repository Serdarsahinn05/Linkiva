import { createHash, createHmac } from "node:crypto";

/**
 * Cookieless, privacy-friendly visitor identity (docs/ARCHITECTURE.md §7):
 * sha256(dailySalt + ip + userAgent + profileId). The salt is derived from a secret and the UTC date,
 * so the same person cannot be linked across days or across profiles, and IPs are never stored.
 */
export function visitorHash({ ip, userAgent, profileId, secret, date = new Date() }: { ip: string; userAgent: string; profileId: string; secret: string; date?: Date }): string {
  const day = date.toISOString().slice(0, 10);
  const salt = createHmac("sha256", secret).update(day).digest("hex");
  return createHash("sha256").update(`${salt}|${ip}|${userAgent}|${profileId}`).digest("hex").slice(0, 32);
}

/** Only the host of the referrer is kept ("instagram.com"); paths and queries can carry personal data. */
export function referrerHost(referrer: string | null | undefined, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^(www|m|l|lm)\./, "");
    if (!host || host === ownHost.replace(/^www\./, "").split(":")[0]) return null;
    // Normalise the short-link hosts social apps use.
    const aliases: Record<string, string> = { "t.co": "x.com", "twitter.com": "x.com", "lnkd.in": "linkedin.com", "youtu.be": "youtube.com", "fb.me": "facebook.com" };
    return aliases[host] ?? host;
  } catch {
    return null;
  }
}

/** utm_source, lower-cased and bounded; anything odd is dropped. */
export function utmSource(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase().slice(0, 40);
  return /^[a-z0-9._-]+$/.test(clean) ? clean : null;
}

/** Vercel geo headers (country is ISO 3166-1 alpha-2, city is URI-encoded). Missing means unknown, never invented. */
export function geoFromHeaders(headers: Headers): { country: string | null; city: string | null } {
  const country = headers.get("x-vercel-ip-country");
  const city = headers.get("x-vercel-ip-city");
  let decodedCity: string | null = null;
  if (city) {
    try {
      decodedCity = decodeURIComponent(city).slice(0, 80);
    } catch {
      decodedCity = null;
    }
  }
  return { country: country && /^[A-Z]{2}$/.test(country) ? country : null, city: decodedCity };
}
