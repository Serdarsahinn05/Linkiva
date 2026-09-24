import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isLive } from "@/lib/schedule";
import { parseBlock } from "@/lib/validation/blocks";

/**
 * Public link redirect. Only visible, live LINK blocks of published profiles resolve, and only to the
 * validated URL stored for that block. Click counting is added here in Phase 4 (docs/ARCHITECTURE.md §7).
 */
export async function GET(_request: Request, { params }: RouteContext<"/l/[blockId]">) {
  const { blockId } = await params;
  const block = await db.block.findUnique({
    where: { id: blockId },
    select: { type: true, data: true, isVisible: true, startsAt: true, endsAt: true, profile: { select: { isPublished: true } } },
  });

  const live =
    block?.isVisible &&
    block.profile.isPublished &&
    isLive({ startsAt: block.startsAt?.toISOString() ?? null, endsAt: block.endsAt?.toISOString() ?? null });
  const parsed = live ? parseBlock(block.type, block.data) : null;

  if (parsed?.type !== "LINK") return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(parsed.data.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
