import { after, NextResponse } from "next/server";
import { recordEvent } from "@/features/analytics/record";
import { db } from "@/lib/db";
import { isLive } from "@/lib/schedule";
import { parseBlock, type ParsedBlock } from "@/lib/validation/blocks";
import { buildVcard, vcardFileName } from "@/lib/vcard";

/**
 * Where a tap on a block leads. Links, images, products and support links go to their validated URL; WhatsApp is
 * rebuilt from the normalised number (never a stored URL); a contact card is a .vcf download. null: nothing to open.
 */
function target(block: ParsedBlock, part: string | null): { redirect: string } | { vcard: string; fileName: string } | null {
  switch (block.type) {
    // A project card opens its live page, else its code; its small "Code" link asks for the repository (?k=repo).
    case "PROJECT": {
      const url = part === "repo" ? block.data.repo : (block.data.url ?? block.data.repo);
      return url ? { redirect: url } : null;
    }
    case "LINK":
    case "PRODUCT":
      return { redirect: block.data.url };
    case "IMAGE":
    case "SUPPORT":
      return block.data.url ? { redirect: block.data.url } : null;
    case "WHATSAPP": {
      const text = block.data.message ? `?text=${encodeURIComponent(block.data.message)}` : "";
      return { redirect: `https://wa.me/${block.data.phone}${text}` };
    }
    case "CONTACT":
      return { vcard: buildVcard(block.data), fileName: vcardFileName(block.data.name) };
    default:
      return null;
  }
}

/**
 * Public block link. Only visible, live blocks of published profiles resolve. The tap is recorded after the response
 * is sent (docs/ARCHITECTURE.md §7).
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
  const destination = parsed ? target(parsed, new URL(request.url).searchParams.get("k")) : null;
  if (!destination || !block) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers(request.headers);
  const profile = block.profile;
  // Referrer of a click is the profile page itself; the source is attributed from the view instead.
  after(() => recordEvent({ type: "CLICK", profile, blockId, headers }).catch((error) => console.error("click record failed", error)));

  if ("vcard" in destination) {
    return new NextResponse(destination.vcard, {
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${destination.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return NextResponse.redirect(destination.redirect, { status: 302, headers: { "Cache-Control": "no-store" } });
}
