import { Prisma } from "@/prisma/generated/client";
import type { EventType } from "@/prisma/generated/enums";
import { auth } from "@/lib/auth";
import { isBot, isPrefetch } from "@/lib/bots";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/ratelimit";
import { site } from "@/lib/site";
import { geoFromHeaders, referrerHost, utmSource, visitorHash } from "@/lib/tracking";
import { parseUserAgent } from "@/lib/ua";

const VIEW_DEDUPE_MS = 30 * 60 * 1000;
const CLICK_DEDUPE_MS = 5 * 1000;

export type RecordInput = {
  type: EventType;
  profile: { id: string; userId: string };
  blockId?: string;
  headers: Headers;
  referrer?: string | null;
  utm?: string | null;
};

export type RecordOutcome = "recorded" | "bot" | "prefetch" | "owner" | "duplicate";

/**
 * The single place where analytics events are written (docs/ARCHITECTURE.md §7).
 * Filters bots, prefetches and the owner's own traffic, and collapses repeats from the same visitor.
 */
export async function recordEvent({ type, profile, blockId, headers, referrer, utm }: RecordInput): Promise<RecordOutcome> {
  const userAgent = headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return "bot";
  if (isPrefetch(headers)) return "prefetch";

  // The owner looking at their own page is not a visitor. The session cookie cache keeps this cheap.
  if (headers.get("cookie")?.includes("session_token")) {
    const session = await auth.api.getSession({ headers }).catch(() => null);
    if (session?.user.id === profile.userId) return "owner";
  }

  const hash = visitorHash({ ip: clientIp(headers), userAgent, profileId: profile.id, secret: env.TRACKING_SALT_SECRET });
  const recent = await db.event.findFirst({
    where: {
      profileId: profile.id,
      visitorHash: hash,
      type,
      ...(type === "CLICK" ? { blockId } : {}),
      createdAt: { gt: new Date(Date.now() - (type === "VIEW" ? VIEW_DEDUPE_MS : CLICK_DEDUPE_MS)) },
    },
    select: { id: true },
  });
  if (recent) return "duplicate";

  // The sliding-window check above handles the common case; this bucketed key makes concurrent
  // repeats (two requests racing past that check) collide on a unique index instead of both landing.
  const windowMs = type === "VIEW" ? VIEW_DEDUPE_MS : CLICK_DEDUPE_MS;
  const dedupeKey = `${type}:${hash}:${blockId ?? "-"}:${Math.floor(Date.now() / windowMs)}`;

  const ua = parseUserAgent(userAgent);
  const geo = geoFromHeaders(headers);
  try {
    await db.event.create({
      data: {
        profileId: profile.id,
        blockId: blockId ?? null,
        type,
        visitorHash: hash,
        country: geo.country,
        city: geo.city,
        device: ua.device,
        os: ua.os,
        browser: ua.browser,
        referrerHost: referrerHost(referrer, site.host),
        utmSource: utmSource(utm),
        dedupeKey,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "duplicate";
    throw error;
  }
  return "recorded";
}
