import type { SocialPlatform } from "@/prisma/generated/enums";
import { normalizeUrl } from "@/lib/validation/url";

type HandlePlatform = {
  kind: "handle";
  label: string;
  /** Hostnames a pasted profile URL may use. */
  hosts: string[];
  /** Builds the public URL from a bare handle. */
  url: (handle: string) => string;
  /** Some platforms show the handle with "@". */
  at?: boolean;
};
type UrlPlatform = { kind: "url"; label: string };
type EmailPlatform = { kind: "email"; label: string };

export const SOCIAL_PLATFORMS = {
  INSTAGRAM: { kind: "handle", label: "Instagram", hosts: ["instagram.com"], url: (h) => `https://instagram.com/${h}`, at: true },
  X: { kind: "handle", label: "X", hosts: ["x.com", "twitter.com"], url: (h) => `https://x.com/${h}`, at: true },
  TIKTOK: { kind: "handle", label: "TikTok", hosts: ["tiktok.com"], url: (h) => `https://www.tiktok.com/@${h}`, at: true },
  YOUTUBE: { kind: "handle", label: "YouTube", hosts: ["youtube.com"], url: (h) => `https://www.youtube.com/@${h}`, at: true },
  GITHUB: { kind: "handle", label: "GitHub", hosts: ["github.com"], url: (h) => `https://github.com/${h}` },
  LINKEDIN: { kind: "handle", label: "LinkedIn", hosts: ["linkedin.com"], url: (h) => `https://www.linkedin.com/in/${h}` },
  TWITCH: { kind: "handle", label: "Twitch", hosts: ["twitch.tv"], url: (h) => `https://www.twitch.tv/${h}` },
  BEHANCE: { kind: "handle", label: "Behance", hosts: ["behance.net"], url: (h) => `https://www.behance.net/${h}` },
  DRIBBBLE: { kind: "handle", label: "Dribbble", hosts: ["dribbble.com"], url: (h) => `https://dribbble.com/${h}` },
  SPOTIFY: { kind: "url", label: "Spotify" },
  DISCORD: { kind: "url", label: "Discord" },
  WEBSITE: { kind: "url", label: "Web" },
  EMAIL: { kind: "email", label: "E-mail" },
} satisfies Record<SocialPlatform, HandlePlatform | UrlPlatform | EmailPlatform>;

export const SOCIAL_ORDER = Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[];

const HANDLE_RE = /^[a-zA-Z0-9._-]{1,60}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Turns whatever the user pasted ("@serdar", "instagram.com/serdar", a full URL) into the stored value:
 * a bare handle for handle platforms, a normalised URL for url platforms, an address for email.
 * Returns null when it cannot be understood. This is what fixes v1's "instagram.com/instagram.com/x" bug.
 */
export function normalizeSocial(platform: SocialPlatform, input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const def = SOCIAL_PLATFORMS[platform];

  if (def.kind === "email") {
    const address = value.replace(/^mailto:/i, "").toLowerCase();
    return EMAIL_RE.test(address) ? address : null;
  }
  if (def.kind === "url") return normalizeUrl(value);

  // Handle platform: accept a URL on one of its hosts, else a bare handle.
  const looksLikeUrl = /[/.]/.test(value.replace(/^@/, "")) && def.hosts.some((h) => value.toLowerCase().includes(h));
  let handle = value;
  if (looksLikeUrl) {
    const url = normalizeUrl(value);
    if (!url) return null;
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    // linkedin.com/in/<handle>; everything else is the first segment.
    handle = (platform === "LINKEDIN" && segments[0] === "in" ? segments[1] : segments[0]) ?? "";
  }
  handle = handle.replace(/^@/, "");
  return HANDLE_RE.test(handle) ? handle : null;
}

/** Public URL for a stored social value. */
export function socialUrl(platform: SocialPlatform, stored: string): string {
  const def = SOCIAL_PLATFORMS[platform];
  if (def.kind === "email") return `mailto:${stored}`;
  if (def.kind === "url") return stored;
  return def.url(stored);
}

/** How the stored value is shown in the editor input. */
export function socialDisplay(platform: SocialPlatform, stored: string): string {
  const def = SOCIAL_PLATFORMS[platform];
  return def.kind === "handle" && "at" in def && def.at ? `@${stored}` : stored;
}
