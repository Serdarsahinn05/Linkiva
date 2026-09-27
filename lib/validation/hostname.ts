import { site } from "@/lib/site";

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/**
 * An owner's custom domain as typed ("Serdar.com", "https://www.serdar.com/", "şahin.com") → its lower-case ASCII host
 * name ("serdar.com", "www.serdar.com", "xn--ahin-...com"), or null. Only real public names: at least two labels and a
 * letter TLD; no IP addresses, ports, paths, localhost, or our own domain and its subdomains.
 */
export function parseHostname(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw || raw.length > 300) return null;
  let host: string;
  try {
    const url = new URL(/^[a-z]+:\/\//.test(raw) ? raw : `https://${raw}`);
    if (url.port || url.username || url.password || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) return null;
    host = url.hostname.replace(/\.$/, "");
  } catch {
    return null;
  }
  const labels = host.split(".");
  if (host.length > 253 || labels.length < 2 || !labels.every((l) => LABEL.test(l))) return null;
  if (!/^[a-z]{2,63}$|^xn--[a-z0-9-]+$/.test(labels.at(-1)!)) return null; // letter TLD (IP addresses end in digits)
  const own = new URL(site.url).hostname;
  if (host === own || host.endsWith(`.${own}`) || host.endsWith(".vercel.app") || host.endsWith(".localhost")) return null;
  return host;
}
