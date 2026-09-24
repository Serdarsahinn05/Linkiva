import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * "Download my data" (GDPR/KVKK portability): everything stored about the caller's account and page,
 * as JSON. Password hashes, tokens and visitor hashes are left out.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      accounts: { select: { providerId: true, createdAt: true } },
      sessions: { select: { createdAt: true, expiresAt: true, userAgent: true } },
      profile: {
        select: {
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          theme: true,
          appearance: true,
          seoTitle: true,
          seoDescription: true,
          showBranding: true,
          isPublished: true,
          locale: true,
          timezone: true,
          createdAt: true,
          blocks: { select: { id: true, type: true, position: true, isVisible: true, isHighlighted: true, data: true, startsAt: true, endsAt: true, createdAt: true }, orderBy: { position: "asc" } },
          socials: { select: { platform: true, handle: true } },
          subscribers: { select: { email: true, createdAt: true } },
          events: { select: { type: true, blockId: true, country: true, city: true, device: true, os: true, browser: true, referrerHost: true, utmSource: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  const body = JSON.stringify({ exportedAt: new Date().toISOString(), ...user }, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="linkiva-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
