import { isImportableUrl } from "@/features/import/importers";
import { parseEmbed } from "@/lib/embeds";
import { normalizePhone } from "@/lib/validation/phone";
import { displayHost, normalizeUrl } from "@/lib/validation/url";

export type Detected =
  | { kind: "EMBED"; url: string }
  | { kind: "LINK"; url: string; title: string }
  | { kind: "WHATSAPP"; phone: string; message?: string }
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
  const whatsapp = parseWhatsapp(new URL(url));
  if (whatsapp) return whatsapp;
  return { kind: "LINK", url, title: displayHost(url) };
}

/** wa.me/<number>?text=… or api.whatsapp.com/send?phone=…: a WhatsApp button rather than a plain link. */
function parseWhatsapp(url: URL): Detected | null {
  const host = url.hostname.replace(/^www\./, "");
  const raw = host === "wa.me" ? url.pathname.slice(1) : host === "api.whatsapp.com" ? (url.searchParams.get("phone") ?? "") : null;
  const phone = raw ? normalizePhone(`+${raw.replace(/^\+/, "")}`) : null;
  if (!phone) return null;
  const message = url.searchParams.get("text")?.trim();
  return message ? { kind: "WHATSAPP", phone, message } : { kind: "WHATSAPP", phone };
}
