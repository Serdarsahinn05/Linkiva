import { env } from "@/lib/env";

/**
 * Vercel's project domain API (ROADMAP Faz 11), with plain fetch. Only ever called with a hostname that
 * lib/validation/hostname.ts accepted. Every call throws on network/API trouble; callers turn that into a user message.
 */

/** A TXT record Vercel asks for when the domain is already claimed by another Vercel account. */
export type VerificationRecord = { type: string; domain: string; value: string };
export type DomainStatus = { verified: boolean; misconfigured: boolean; verification: VerificationRecord[] };

export class DomainUnavailableError extends Error {}

const BASE = "https://api.vercel.com";

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) throw new Error("custom domains are not configured");
  const url = new URL(path.replace(":project", encodeURIComponent(env.VERCEL_PROJECT_ID)), BASE);
  if (env.VERCEL_TEAM_ID) url.searchParams.set("teamId", env.VERCEL_TEAM_ID);
  return fetch(url, {
    ...init,
    headers: { authorization: `Bearer ${env.VERCEL_API_TOKEN}`, "content-type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`vercel ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

type ProjectDomain = { verified?: boolean; verification?: VerificationRecord[] };

/** Adds the domain to this project. A domain that another Vercel project already serves is refused. */
export async function addDomain(hostname: string): Promise<void> {
  const res = await call("/v10/projects/:project/domains", { method: "POST", body: JSON.stringify({ name: hostname }) });
  // 409: already on this or another project; 400: a name Vercel does not accept.
  if (res.status === 409 || res.status === 400) throw new DomainUnavailableError(await res.text());
  await json(res);
}

/** Whether Vercel owns the name for us (verified) and its DNS points at Vercel (not misconfigured). Asks Vercel to verify again. */
export async function domainStatus(hostname: string): Promise<DomainStatus> {
  const name = encodeURIComponent(hostname);
  let domain = await json<ProjectDomain>(await call(`/v9/projects/:project/domains/${name}`));
  if (!domain.verified) {
    const res = await call(`/v9/projects/:project/domains/${name}/verify`, { method: "POST" });
    // Not verifiable yet (the TXT record is missing) is an answer, not a failure.
    if (res.ok) domain = await json<ProjectDomain>(res);
  }
  const config = await json<{ misconfigured?: boolean }>(await call(`/v6/domains/${name}/config`));
  return { verified: Boolean(domain.verified), misconfigured: config.misconfigured !== false, verification: domain.verification ?? [] };
}

/** Removes the domain from this project; a domain that is already gone is fine. */
export async function removeDomain(hostname: string): Promise<void> {
  const res = await call(`/v9/projects/:project/domains/${encodeURIComponent(hostname)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) await json(res);
}
