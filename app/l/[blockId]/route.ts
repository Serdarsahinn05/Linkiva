import { after, NextResponse } from "next/server";
import { recordEvent } from "@/features/analytics/record";
import { db } from "@/lib/db";
import { isLive } from "@/lib/schedule";
import { parseBlock } from "@/lib/validation/blocks";

/**
 * Public link redirect. Only visible, live LINK blocks of published profiles resolve, and only to the
 * validated URL stored for that block. The click is recorded after the redirect is sent (docs/ARCHITECTURE.md §7).
 */
export async function GET(request: Request, { params }: RouteContext<"/l/[blockId]">) {
  const { blockId } = await params;
  const block = await db.block.findUnique({
    where: { id: blockId },
    select: { type: true, data: true, isVisible: true, startsAt: true, endsAt: true, profile: { select: { id: true, userId: true, isPublished: true } } },
  });

  const live =
    block?.isVisible &&
    block.profile.isPublished &&
    isLive({ startsAt: block.startsAt?.toISOString() ?? null, endsAt: block.endsAt?.toISOString() ?? null });
  const parsed = live ? parseBlock(block.type, block.data) : null;

  if (parsed?.type !== "LINK" || !block) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers(request.headers);
  const profile = block.profile;
  // Referrer of a click is the profile page itself; the source is attributed from the view instead.
  after(() => recordEvent({ type: "CLICK", profile, blockId, headers }).catch((error) => console.error("click record failed", error)));
  return NextResponse.redirect(parsed.data.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
