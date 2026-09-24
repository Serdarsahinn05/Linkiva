import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { BlockType, SocialPlatform } from "@/prisma/generated/enums";
import { db } from "@/lib/db";
import { SOCIAL_ORDER } from "@/lib/socials";

export const profileTag = (username: string) => `profile:${username}`;

/** Serializable (cache-safe) view of a profile: dates are ISO strings. */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  showBranding: boolean;
  locale: string;
  isPublished: boolean;
  blocks: PublicBlock[];
  socials: { platform: SocialPlatform; handle: string }[];
};

export type PublicBlock = {
  id: string;
  type: BlockType;
  data: unknown;
  isHighlighted: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

async function loadProfile(username: string): Promise<PublicProfile | null> {
  const profile = await db.profile.findUnique({
    where: { username },
    include: {
      blocks: { where: { isVisible: true }, orderBy: { position: "asc" } },
      socials: true,
    },
  });
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    theme: profile.theme,
    showBranding: profile.showBranding,
    locale: profile.locale,
    isPublished: profile.isPublished,
    blocks: profile.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      data: b.data,
      isHighlighted: b.isHighlighted,
      startsAt: b.startsAt?.toISOString() ?? null,
      endsAt: b.endsAt?.toISOString() ?? null,
    })),
    socials: profile.socials
      .sort((a, b) => SOCIAL_ORDER.indexOf(a.platform) - SOCIAL_ORDER.indexOf(b.platform))
      .map((s) => ({ platform: s.platform, handle: s.handle })),
  };
}

/**
 * Cached per username and invalidated with updateTag(profileTag(username)) by every editor mutation.
 * React.cache dedupes the call between generateMetadata and the page.
 */
export const getPublicProfile = cache((username: string) =>
  unstable_cache(() => loadProfile(username), ["public-profile", username], { tags: [profileTag(username)] })(),
);

/** Scheduled blocks are filtered at render time, so a cached profile still respects the clock. */
export function isLive(block: Pick<PublicBlock, "startsAt" | "endsAt">, now = Date.now()): boolean {
  if (block.startsAt && Date.parse(block.startsAt) > now) return false;
  if (block.endsAt && Date.parse(block.endsAt) <= now) return false;
  return true;
}

/** Blocks visible right now (request time). */
export function liveBlocks<T extends Pick<PublicBlock, "startsAt" | "endsAt">>(blocks: T[]): T[] {
  const now = Date.now();
  return blocks.filter((b) => isLive(b, now));
}
