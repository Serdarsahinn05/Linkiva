import { verifyUnsubscribeToken } from "@/features/digest/token";
import { db } from "@/lib/db";

/** RFC 8058 one-click opt-out: the mail client POSTs "List-Unsubscribe=One-Click" here, no session, no page. */
export async function POST(request: Request) {
  const profileId = verifyUnsubscribeToken(new URL(request.url).searchParams.get("t"));
  if (!profileId) return new Response(null, { status: 400 });
  await db.profile.updateMany({ where: { id: profileId }, data: { weeklyDigest: false } });
  return new Response(null, { status: 200 });
}

/** A client that opens the header link instead gets the confirmation page (a GET never unsubscribes). */
export function GET(request: Request) {
  const url = new URL(request.url);
  return Response.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(url.searchParams.get("t") ?? "")}`, url), 303);
}
