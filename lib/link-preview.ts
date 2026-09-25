import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { site } from "@/lib/site";

/**
 * Link preview cards: reads a public page's Open Graph data once, on the owner's request.
 * The server fetches a user-supplied URL, so every request is SSRF-guarded:
 * - only http(s) on ports 80/443;
 * - the address is checked *at connect time* (custom lookup), so DNS rebinding cannot swap in a private IP;
 * - private, loopback, link-local, metadata and other non-public ranges are refused (IPv4, IPv6, mapped);
 * - redirects are followed by hand (max 3), each hop checked again;
 * - hard time and size limits.
 */

const BLOCKED = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) BLOCKED.addSubnet(net, prefix, "ipv4");
for (const [net, prefix] of [
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001:db8::", 32], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) BLOCKED.addSubnet(net, prefix, "ipv6");

/** True for addresses a server-side fetch may reach (public unicast only). */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !BLOCKED.check(address, "ipv4");
  if (family !== 6) return false;
  // IPv4-mapped IPv6 (::ffff:10.0.0.1) is judged as the IPv4 address it carries.
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return !BLOCKED.check(mapped[1]!, "ipv4");
  return !BLOCKED.check(address, "ipv6");
}

class BlockedAddressError extends Error {}

const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 4);
    const list = addresses as unknown as { address: string; family: number }[];
    // Refuse the host outright if any of its addresses is private (no picking the "good" one).
    if (!list.length || list.some((a) => !isPublicAddress(a.address))) return callback(new BlockedAddressError("blocked address"), "", 4);
    // Node asks for every address when it races IPv4/IPv6 (autoSelectFamily); otherwise the first one.
    if (options.all) return (callback as unknown as (e: null, a: typeof list) => void)(null, list);
    callback(null, list[0]!.address, list[0]!.family);
  });
};

const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

type Fetched = { url: URL; contentType: string; body: Buffer; truncated: boolean };

function checkTarget(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new BlockedAddressError("scheme");
  if (url.port && url.port !== "80" && url.port !== "443") throw new BlockedAddressError("port");
  if (url.username || url.password) throw new BlockedAddressError("credentials");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  // A literal IP never goes through lookup, so it is checked here.
  if (isIP(host) && !isPublicAddress(host)) throw new BlockedAddressError("literal address");
}

/** One GET with the guards above. Bodies beyond maxBytes are cut off (truncated: true). */
function getOnce(url: URL, accept: string, maxBytes: number, signal: AbortSignal): Promise<Fetched | { redirect: URL }> {
  checkTarget(url);
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        lookup: guardedLookup,
        signal,
        headers: { "user-agent": `LinkivaBot/1.0 (+${site.url})`, accept, "accept-language": "tr,en;q=0.8" },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume();
          return resolve({ redirect: new URL(response.headers.location, url) });
        }
        if (status < 200 || status >= 300) {
          response.resume();
          return reject(new Error(`status ${status}`));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        response.on("data", (chunk: Buffer) => {
          if (truncated) return;
          size += chunk.length;
          if (size > maxBytes) {
            truncated = true;
            chunks.push(chunk.subarray(0, chunk.length - (size - maxBytes)));
            response.destroy();
            return resolve({ url, contentType: String(response.headers["content-type"] ?? ""), body: Buffer.concat(chunks), truncated });
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve({ url, contentType: String(response.headers["content-type"] ?? ""), body: Buffer.concat(chunks), truncated }));
        response.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

async function safeGet(url: URL, accept: string, maxBytes: number): Promise<Fetched> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const result = await getOnce(current, accept, maxBytes, signal);
    if (!("redirect" in result)) return result;
    current = result.redirect;
  }
  throw new Error("too many redirects");
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : whole;
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

const clean = (text: string | undefined, max: number) => {
  const value = text ? decodeEntities(text).replace(/\s+/g, " ").trim() : "";
  return value ? (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value) : undefined;
};

export type PreviewText = { title?: string; description?: string; image?: string };

/** Open Graph / Twitter / plain HTML metadata of a page. Pure, so it is unit-tested directly. */
export function parsePreview(html: string, pageUrl: string): PreviewText {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || html.length);
  const meta = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = new Map<string, string>();
    for (const m of tag.matchAll(/([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) attrs.set(m[1]!.toLowerCase(), m[2] ?? m[3] ?? m[4] ?? "");
    const key = (attrs.get("property") ?? attrs.get("name"))?.toLowerCase();
    const content = attrs.get("content");
    if (key && content && !meta.has(key)) meta.set(key, content);
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const pick = (...keys: string[]) => keys.map((k) => meta.get(k)).find(Boolean);

  let image: string | undefined;
  const rawImage = pick("og:image:secure_url", "og:image:url", "og:image", "twitter:image", "twitter:image:src");
  if (rawImage) {
    try {
      const resolved = new URL(decodeEntities(rawImage.trim()), pageUrl);
      if (resolved.protocol === "https:" || resolved.protocol === "http:") image = resolved.toString();
    } catch {
      // Unparseable image URL: card without an image.
    }
  }
  return {
    title: clean(pick("og:title", "twitter:title") ?? titleTag, 80),
    description: clean(pick("og:description", "twitter:description", "description"), 200),
    image,
  };
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const HTML_MAX_BYTES = 512 * 1024;

/** Sniffs the real image type from its first bytes (the Content-Type header is not trusted). */
export function imageType(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (bytes.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  return null;
}

export type LinkPreview = PreviewText & { imageFile?: { bytes: Buffer; type: string } };

/** Fetches and parses a page; null when it cannot be read (unreachable, blocked, not HTML). */
export async function getLinkPreview(pageUrl: string): Promise<LinkPreview | null> {
  let page: Fetched;
  try {
    page = await safeGet(new URL(pageUrl), "text/html,application/xhtml+xml", HTML_MAX_BYTES);
  } catch {
    return null;
  }
  if (!/text\/html|application\/xhtml\+xml/i.test(page.contentType)) return null;
  const charset = page.contentType.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
  let html: string;
  try {
    html = new TextDecoder(charset).decode(page.body);
  } catch {
    html = page.body.toString("utf8");
  }
  const text = parsePreview(html, page.url.toString());
  if (!text.image) return text;

  try {
    const image = await safeGet(new URL(text.image), "image/*", IMAGE_MAX_BYTES);
    const type = imageType(image.body);
    if (!image.truncated && type) return { ...text, imageFile: { bytes: image.body, type } };
  } catch {
    // The card still works without its image.
  }
  return text;
}
