import { isImportableUrl } from "@/features/import/importers";
import { parseEmbed } from "@/lib/embeds";
import { displayHost, normalizeUrl } from "@/lib/validation/url";

export type Detected =
  | { kind: "EMBED"; url: string }
  | { kind: "LINK"; url: string; title: string }
  /** Another bio-link page: offer to import it instead of linking to it. */
  | { kind: "IMPORT"; url: string };

/** What a pasted address should become in the editor. null when it is not a usable address. */
export function detectBlock(input: string): Detected | null {
  const text = input.trim();
  if (!text || /\s/.test(text)) return null;
  const url = normalizeUrl(text);
  if (!url) return null;
  if (isImportableUrl(url)) return { kind: "IMPORT", url };
  if (parseEmbed(url)) return { kind: "EMBED", url };
  return { kind: "LINK", url, title: displayHost(url) };
}
