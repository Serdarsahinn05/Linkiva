import { timingSafeEqual } from "node:crypto";
import { runWeeklyDigest } from "@/features/digest/digest";
import { runLinkCheck } from "@/features/link-check/check";
import { env } from "@/lib/env";

// A full digest batch is a hundred summaries of a dozen aggregate queries each; the link check caps its own run time.
export const maxDuration = 60;

const authorized = (header: string | null, secret: string) => {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/**
 * Vercel Cron, once a day (vercel.json). Weekly summary: each profile gets one per week, starting Monday; a week
 * bigger than one batch finishes on the following days. Broken link check: a bounded batch every day. The two jobs
 * run side by side and one failing does not stop the other. Off (404) without CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) return new Response("Not found", { status: 404 });
  if (!authorized(request.headers.get("authorization"), env.CRON_SECRET)) return new Response("Unauthorized", { status: 401 });
  const [digest, links] = await Promise.allSettled([runWeeklyDigest(), runLinkCheck()]);
  const result = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? r.value : { error: true });
  for (const [name, r] of [["digest", digest], ["links", links]] as const) {
    if (r.status === "rejected") console.error(`[cron:daily] ${name} failed`, r.reason);
  }
  console.info("[cron:daily]", { digest: result(digest), links: result(links) });
  const failed = digest.status === "rejected" || links.status === "rejected";
  return Response.json({ digest: result(digest), links: result(links) }, { status: failed ? 500 : 200 });
}
