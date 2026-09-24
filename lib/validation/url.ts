const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:"]);

/**
 * Normalises a user-typed destination into a safe absolute URL, or null.
 * "github.com/x" → "https://github.com/x". Anything outside http(s)/mailto/tel
 * (javascript:, data:, file:…) is rejected.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 2048) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  const candidate = hasScheme ? raw : `https://${raw.replace(/^\/+/, "")}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
  if ((url.protocol === "https:" || url.protocol === "http:") && !url.hostname.includes(".") && url.hostname !== "localhost") return null;
  return url.toString();
}

/** "https://www.github.com/x" → "github.com". For display and favicon lookup. */
export function displayHost(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "mailto:") return u.pathname;
    if (u.protocol === "tel:") return u.pathname;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
