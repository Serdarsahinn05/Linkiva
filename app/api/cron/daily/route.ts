import { purgeDueAccounts } from "@/features/account/deletion";
import { runWeeklyDigest } from "@/features/digest/digest";
import { runLinkCheck } from "@/features/link-check/check";
import { runCleanup } from "@/features/maintenance/cleanup";
import { hasBearer } from "@/lib/bearer";
import { env } from "@/lib/env";

// A full digest batch is a hundred summaries of a dozen aggregate queries each; the link check caps its own run time.
export const maxDuration = 60;

/**
 * Vercel Cron, once a day (vercel.json). Weekly summary: each profile gets one per week, starting Monday; a week
 * bigger than one batch finishes on the following days. Broken link check: a bounded batch every day. Clean-up:
 * expired records the privacy notice promises to delete. Accounts: deletions whose waiting period is over are erased.
 * The jobs run side by side and one failing does not stop the others. Off (404) without CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) return new Response("Not found", { status: 404 });
  if (!hasBearer(request.headers.get("authorization"), env.CRON_SECRET)) return new Response("Unauthorized", { status: 401 });
  const [digest, links, cleanup, accounts] = await Promise.allSettled([runWeeklyDigest(), runLinkCheck(), runCleanup(), purgeDueAccounts()]);
  const result = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? r.value : { error: true });
  const jobs = [["digest", digest], ["links", links], ["cleanup", cleanup], ["accounts", accounts]] as const;
  for (const [name, r] of jobs) {
    if (r.status === "rejected") console.error(`[cron:daily] ${name} failed`, r.reason);
  }
  const results = { digest: result(digest), links: result(links), cleanup: result(cleanup), accounts: result(accounts) };
  console.info("[cron:daily]", results);
  return Response.json(results, { status: jobs.some(([, r]) => r.status === "rejected") ? 500 : 200 });
}
