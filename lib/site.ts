// Single source of truth for public URLs. Never hard-code the domain elsewhere.
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const site = {
  name: "Linkiva",
  url: appUrl,
  host: new URL(appUrl).host,
} as const;

export function profileUrl(username: string): string {
  return `${site.url}/${username}`;
}

/** "linkiva.space/serdar": for display, without protocol. */
export function profileDisplayUrl(username: string): string {
  return `${site.host}/${username}`;
}
