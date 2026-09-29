import { getBlockSparklines } from "@/features/analytics/queries";
import { BROKEN_AFTER, checkableUrl } from "@/features/link-check/targets";
import { db } from "@/lib/db";
import { profileUrl } from "@/lib/site";
import { parseBlock } from "@/lib/validation/blocks";
import { toEditorBlock, type EditorBlock, type EditorProfile, type EditorSocials, type GuideData, type LinkIssue } from "./types";

/** `sparklines: false` skips the click-history query for screens that don't show it (Appearance). */
export async function getEditorData(userId: string, { sparklines: withSparklines = true } = {}): Promise<{
  profile: EditorProfile;
  blocks: EditorBlock[];
  socials: EditorSocials;
  sparklines: Record<string, number[]>;
  linkIssues: Record<string, LinkIssue>;
  guide: GuideData;
} | null> {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: { blocks: { orderBy: { position: "asc" }, include: { linkCheck: true } }, socials: true, customDomain: { select: { hostname: true, verifiedAt: true } } },
  });
  if (!profile) return null;
  const sparklines = withSparklines ? await getBlockSparklines(profile) : {};
  const guideOpen = profile.guideDismissedAt === null;
  // "Shared" is only ticked by a real visitor: owner visits, bots and previews never become a VIEW (features/analytics/record.ts).
  const visited = guideOpen && (await db.event.findFirst({ where: { profileId: profile.id, type: "VIEW" }, select: { id: true } })) !== null;
  const domain = profile.customDomain?.verifiedAt ? profile.customDomain.hostname : null;
  // Only a destination that really failed the daily check BROKEN_AFTER times in a row, and that the block still points to.
  const linkIssues: Record<string, LinkIssue> = {};
  for (const { id, type, data, linkCheck: c } of profile.blocks) {
    if (c?.status !== "BROKEN" || c.failCount < BROKEN_AFTER) continue;
    const parsed = parseBlock(type, data);
    if (parsed && checkableUrl(parsed) === c.url) linkIssues[id] = { url: c.url, checkedAt: c.checkedAt.toISOString() };
  }
  return {
    sparklines,
    linkIssues,
    guide: { open: guideOpen, visited, shareUrl: profileUrl(profile.username, domain) },
    profile: {
      username: profile.username,
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl,
      theme: profile.theme,
      appearance: profile.appearance,
      showBranding: profile.showBranding,
    },
    blocks: profile.blocks.map(toEditorBlock),
    socials: Object.fromEntries(profile.socials.map((s) => [s.platform, s.handle])),
  };
}
