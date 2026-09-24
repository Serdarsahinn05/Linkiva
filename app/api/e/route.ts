import { after, NextResponse } from "next/server";
import { z } from "zod";
import { recordEvent } from "@/features/analytics/record";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";

const beaconSchema = z.object({
  p: z.string().min(1).max(40),
  r: z.string().max(2048).nullish(),
  u: z.string().max(80).nullish(),
});

/**
 * Profile view beacon (sent by navigator.sendBeacon from the public profile). Always answers 204 fast;
 * the write happens after the response. Nothing is written during page render (v1 bug A2).
 */
export async function POST(request: Request) {
  const noContent = new NextResponse(null, { status: 204 });
  if (!(await allow("beacon", clientIp(request.headers), 60, 60))) return noContent;

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return noContent;
  }
  const parsed = beaconSchema.safeParse(body);
  if (!parsed.success) return noContent;

  const headers = new Headers(request.headers);
  after(async () => {
    const profile = await db.profile.findUnique({ where: { id: parsed.data.p }, select: { id: true, userId: true, isPublished: true } });
    if (!profile?.isPublished) return;
    await recordEvent({ type: "VIEW", profile, headers, referrer: parsed.data.r, utm: parsed.data.u }).catch((error) => console.error("view record failed", error));
  });
  return noContent;
}
