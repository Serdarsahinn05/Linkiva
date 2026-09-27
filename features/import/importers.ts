import { GITHUB_LOGIN } from "@/lib/validation/github";
import { normalizeUrl } from "@/lib/validation/url";
import { parseLinktree } from "./linktree";
import type { ImportedPage } from "./types";

/** Bio-link hosts we can read, each with its parser. Only these hosts are ever fetched for an import. */
const IMPORTERS: Record<string, (html: string) => ImportedPage | null> = {
  "linktr.ee": parseLinktree,
};

/** GitHub pages that are not a user (github.com/<login>). */
const GITHUB_RESERVED = new Set(["orgs", "settings", "features", "topics", "explore", "marketplace", "pricing", "about", "login", "join", "sponsors", "apps", "collections", "trending", "notifications", "new", "search"]);

export type Importer =
  | { source: "page"; url: string; hosts: string[]; parse: (html: string) => ImportedPage | null }
  | { source: "github"; login: string };

/**
 * What a pasted address can be imported from: a bio-link page ("linktr.ee/name") to fetch and parse, or a GitHub user
 * ("github.com/name") whose repositories become project cards. null when it is neither.
 */
export function findImporter(input: string): Importer | null {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  // A profile is exactly one path segment: linktr.ee/<name>, github.com/<login>.
  if (segments.length !== 1) return null;
  if (host === "github.com") {
    const login = segments[0]!;
    return GITHUB_LOGIN.test(login) && !GITHUB_RESERVED.has(login.toLowerCase()) ? { source: "github", login } : null;
  }
  const parse = IMPORTERS[host];
  return parse ? { source: "page", url: `https://${host}/${segments[0]}`, hosts: [host, `www.${host}`], parse } : null;
}
