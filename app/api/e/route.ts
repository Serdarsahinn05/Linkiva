import { after, NextResponse } from "next/server";
import { z } from "zod";
import { recordEvent } from "@/features/analytics/record";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";

const beaconSchema = z.object({
  p: z.string().min(1).max(40),
  r: z.string().max(2048).nullish(),
  u: z.string().max(80).nullish(),
  // A copy (IBAN, name) on a support block: counted as that block's click.
  b: z.string().min(1).max(40).optional(),
  k: z.literal("copy").optional(),
});

/**
 * Profile view beacon (and, with b + k="copy", a copy on a support block) (sent by navigator.sendBeacon from the public profile). Always answers 204 fast;
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
  const { p, b, k } = parsed.data;
  after(async () => {
    const profile = await db.profile.findUnique({ where: { id: p }, select: { id: true, userId: true, isPublished: true } });
    if (!profile?.isPublished) return;
    if (k === "copy" && b) {
      // Only a visible support block of this very profile can be counted.
      const block = await db.block.findFirst({ where: { id: b, profileId: profile.id, type: "SUPPORT", isVisible: true }, select: { id: true } });
      if (block) await recordEvent({ type: "CLICK", profile, blockId: block.id, headers }).catch((error) => console.error("copy record failed", error));
      return;
    }
    await recordEvent({ type: "VIEW", profile, headers, referrer: parsed.data.r, utm: parsed.data.u }).catch((error) => console.error("view record failed", error));
  });
  return noContent;
}
