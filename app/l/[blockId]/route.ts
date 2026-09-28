import { after, NextResponse } from "next/server";
import { recordEvent } from "@/features/analytics/record";
import { getLiveBlock } from "@/features/profile/public";
import type { ParsedBlock } from "@/lib/validation/blocks";
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
 * is sent (docs/ARCHITECTURE.md §7). A link marked sensitive (adult / spoiler) first shows a server-rendered warning
 * page; only the tap confirmed there (?ok=1) is recorded and forwarded.
 */
export async function GET(request: Request, { params }: RouteContext<"/l/[blockId]">) {
  const { blockId } = await params;
  const live = await getLiveBlock(blockId);
  const search = new URL(request.url).searchParams;
  const destination = live ? target(live.block, search.get("k")) : null;
  if (!live || !destination) return new NextResponse("Not found", { status: 404 });

  if (live.block.type === "LINK" && live.block.data.gate && search.get("ok") !== "1") {
    // Relative, so it stays on a custom domain.
    return new NextResponse(null, { status: 302, headers: { Location: `/l/${blockId}/gate`, "Cache-Control": "no-store" } });
  }

  const headers = new Headers(request.headers);
  const profile = live.profile;
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
