// Single source of truth for public URLs. Never hard-code the domain elsewhere.
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const site = {
  name: "Linkiva",
  url: appUrl,
  host: new URL(appUrl).host,
  /** The real mailbox people write to (docs/DEPLOY.md §5): contact, rights requests, abuse reports. */
  email: "hello@linkiva.space",
} as const;

/** The profile's address: its verified custom domain when it has one (ROADMAP Faz 11), else linkiva.space/<username>. */
export function profileUrl(username: string, domain?: string | null): string {
  return domain ? `https://${domain}` : `${site.url}/${username}`;
}

/** "linkiva.space/serdar" (or "serdar.com"): for display, without protocol. */
export function profileDisplayUrl(username: string, domain?: string | null): string {
  return domain ?? `${site.host}/${username}`;
}
