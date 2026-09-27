import { timingSafeEqual } from "node:crypto";
import { runWeeklyDigest } from "@/features/digest/digest";
import { env } from "@/lib/env";

// A full batch is a hundred summaries of a dozen aggregate queries each.
export const maxDuration = 60;

const authorized = (header: string | null, secret: string) => {
  const given = Buffer.from(header ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/**
 * Vercel Cron, once a day (vercel.json). Weekly summary: each profile gets one per week, starting Monday; a week
 * bigger than one batch finishes on the following days. Off (404) without CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) return new Response("Not found", { status: 404 });
  if (!authorized(request.headers.get("authorization"), env.CRON_SECRET)) return new Response("Unauthorized", { status: 401 });
  const digest = await runWeeklyDigest();
  console.info("[cron:daily] digest", digest);
  return Response.json({ digest });
}
