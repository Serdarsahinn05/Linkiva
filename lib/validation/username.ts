import { z } from "zod";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

// 3–30 chars, lowercase ASCII letters/digits and . _ -, must start and end with a letter or digit.
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/;

/**
 * Names that can never be claimed: every top-level route (a profile there would be unreachable)
 * plus names that could impersonate the product. tests/unit/username.test.ts keeps this in sync with app/.
 */
export const RESERVED_USERNAMES = new Set([
  // routes
  "api", "l", "e", "login", "register", "forgot-password", "reset-password", "check-email", "verify-email",
  "onboarding", "dashboard", "settings", "privacy", "terms",
  // framework / metadata files
  "_next", "static", "public", "favicon.ico", "robots.txt", "sitemap.xml", "manifest.webmanifest",
  "opengraph-image", "twitter-image", "icon", "apple-icon",
  // product & impersonation
  "linkiva", "admin", "administrator", "root", "support", "help", "about", "blog", "app", "www", "mail",
  "email", "security", "status", "official", "staff", "team", "moderator", "abuse", "legal", "pricing",
  "account", "auth", "signin", "signup", "logout", "new", "null", "undefined",
]);

const TURKISH_MAP: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

/** Best-effort conversion of free text ("Serdar Şahin") into a username candidate ("serdar.sahin"). */
export function toUsernameCandidate(input: string): string {
  return input
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => TURKISH_MAP[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/[._-]{2,}/g, (m) => m[0] ?? "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, USERNAME_MAX);
}

/**
 * Per-keystroke filter for the username field: transliterates and drops invalid characters but,
 * unlike toUsernameCandidate, keeps separators at the edges so "serdar." can become "serdar.dev".
 */
export function sanitizeUsernameInput(input: string): string {
  return input
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => TURKISH_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, USERNAME_MAX);
}

export type UsernameProblem = "tooShort" | "tooLong" | "invalid" | "reserved";

export function usernameProblem(value: string): UsernameProblem | null {
  if (value.length < USERNAME_MIN) return "tooShort";
  if (value.length > USERNAME_MAX) return "tooLong";
  if (!USERNAME_RE.test(value)) return "invalid";
  if (RESERVED_USERNAMES.has(value)) return "reserved";
  return null;
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    const problem = usernameProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  });
