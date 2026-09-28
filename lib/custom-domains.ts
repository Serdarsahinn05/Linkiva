import { site } from "@/lib/site";

/**
 * Custom domains (ROADMAP Faz 11): which requests the proxy hands to a profile. Pure, so it is unit-tested.
 * - main: our own host or a Vercel preview → untouched.
 * - For a custom host, only the profile's own pages are rewritten to /<username>…; the paths those pages call
 *   (/l/<id> and its sensitive content warning /l/<id>/gate, /api/e, Next's assets, icons) pass through; everything
 *   else (panel, sign-in, other profiles) is a 404.
 */
export type DomainRoute = { kind: "main" } | { kind: "pass" } | { kind: "profile"; path: string } | { kind: "notFound" };

const PASS = /^\/(?:_next\/|l\/[^/]+(?:\/gate)?$|api\/e$|favicon\.ico$|icon\.svg$|robots\.txt$)/;
const PROFILE = /^\/(?:story|opengraph-image[\w-]*)?$/;

export function isMainHost(host: string): boolean {
  const name = host.split(":")[0]!.toLowerCase();
  return host.toLowerCase() === site.host.toLowerCase() || name === new URL(site.url).hostname || name.endsWith(".vercel.app") || /^[\d.]+$|^\[/.test(name) || name === "localhost";
}

export function domainRoute(host: string, pathname: string): DomainRoute {
  if (isMainHost(host)) return { kind: "main" };
  if (PASS.test(pathname)) return { kind: "pass" };
  if (PROFILE.test(pathname)) return { kind: "profile", path: pathname === "/" ? "" : pathname };
  return { kind: "notFound" };
}

/** The DNS record an owner adds: apex domains point an A record at Vercel, subdomains a CNAME. */
export function dnsRecord(hostname: string): { type: "A" | "CNAME"; name: string; value: string } {
  const labels = hostname.split(".");
  // The apex is the registrable name: two labels ("serdar.com"), or three under a two-part suffix ("serdar.com.tr").
  // An apex takes an A record (DNS forbids a CNAME there); anything below it a CNAME.
  const twoPart = /^(com|net|org|gen|web|biz|info|av|dr|bel|edu|gov|k12|co|ac|me)\.(tr|uk|jp|au|nz|za|br|in|kr)$/.test(labels.slice(-2).join("."));
  const apexLabels = twoPart ? 3 : 2;
  if (labels.length <= apexLabels) return { type: "A", name: "@", value: "76.76.21.21" };
  return { type: "CNAME", name: labels.slice(0, labels.length - apexLabels).join("."), value: "cname.vercel-dns.com" };
}
