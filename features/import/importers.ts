import { normalizeUrl } from "@/lib/validation/url";
import { parseLinktree } from "./linktree";
import type { ImportedPage } from "./types";

/** Bio-link hosts we can read, each with its parser. Only these hosts are ever fetched for an import. */
const IMPORTERS: Record<string, (html: string) => ImportedPage | null> = {
  "linktr.ee": parseLinktree,
};

/** The page to fetch for a pasted address ("linktr.ee/name", a full URL…), or null when it is not a supported profile page. */
export function findImporter(input: string) {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parse = IMPORTERS[host];
  const segments = url.pathname.split("/").filter(Boolean);
  // A profile is exactly one path segment: linktr.ee/<name>.
  if (!parse || segments.length !== 1) return null;
  return { url: `https://${host}/${segments[0]}`, hosts: [host, `www.${host}`], parse };
}

export const isImportableUrl = (input: string) => findImporter(input) !== null;
