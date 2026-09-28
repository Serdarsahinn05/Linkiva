import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { BlockSize, BlockType, SocialPlatform } from "@/prisma/generated/enums";
import { db } from "@/lib/db";
import { isLive } from "@/lib/schedule";
import { SOCIAL_ORDER } from "@/lib/socials";
import { parseBlock } from "@/lib/validation/blocks";

export const profileTag = (username: string) => `profile:${username}`;

/** Serializable (cache-safe) view of a profile: dates are ISO strings. */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  appearance: unknown;
  showBranding: boolean;
  locale: string;
  timezone: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Verified custom domain (the profile's canonical address), or null. */
  customDomain: string | null;
  blocks: PublicBlock[];
  socials: { platform: SocialPlatform; handle: string }[];
};

export type PublicBlock = {
  id: string;
  type: BlockType;
  data: unknown;
  isHighlighted: boolean;
  size: BlockSize;
  startsAt: string | null;
  endsAt: string | null;
};

async function loadProfile(username: string): Promise<PublicProfile | null> {
  const profile = await db.profile.findUnique({
    where: { username },
    include: {
      blocks: { where: { isVisible: true }, orderBy: { position: "asc" } },
      socials: true,
      customDomain: { select: { hostname: true, verifiedAt: true } },
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
    appearance: profile.appearance,
    showBranding: profile.showBranding,
    locale: profile.locale,
    timezone: profile.timezone,
    isPublished: profile.isPublished,
    seoTitle: profile.seoTitle,
    seoDescription: profile.seoDescription,
    customDomain: profile.customDomain?.verifiedAt ? profile.customDomain.hostname : null,
    blocks: profile.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      data: b.data,
      isHighlighted: b.isHighlighted,
      size: b.size,
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

/**
 * A block a visitor may open: visible, inside its schedule, valid, on a published profile; else null. Uncached, read by
 * the /l route and the sensitive content page on every tap.
 */
export async function getLiveBlock(blockId: string) {
  const block = await db.block.findUnique({
    where: { id: blockId },
    select: {
      type: true,
      data: true,
      isVisible: true,
      startsAt: true,
      endsAt: true,
      profile: { select: { id: true, userId: true, username: true, displayName: true, isPublished: true, customDomain: { select: { hostname: true, verifiedAt: true } } } },
    },
  });
  if (!block?.isVisible || !block.profile.isPublished) return null;
  if (!isLive({ startsAt: block.startsAt?.toISOString() ?? null, endsAt: block.endsAt?.toISOString() ?? null })) return null;
  const parsed = parseBlock(block.type, block.data);
  if (!parsed) return null;
  const { customDomain, ...profile } = block.profile;
  return { block: parsed, profile: { ...profile, domain: customDomain?.verifiedAt ? customDomain.hostname : null } };
}

/**
 * Where a past username now lives, while its redirect is still valid (UsernameHistory). Cached under the old name's tag,
 * which changeUsername invalidates; the expiry is checked per request so a cached row cannot outlive its 90 days.
 */
export async function getUsernameRedirect(username: string): Promise<string | null> {
  const past = await unstable_cache(
    async () => {
      const row = await db.usernameHistory.findUnique({ where: { username }, select: { expiresAt: true, profile: { select: { username: true } } } });
      return row ? { to: row.profile.username, expiresAt: row.expiresAt.toISOString() } : null;
    },
    ["username-redirect", username],
    { tags: [profileTag(username)] },
  )();
  return past && new Date(past.expiresAt) > new Date() ? past.to : null;
}
