import { getBlockSparklines } from "@/features/analytics/queries";
import { db } from "@/lib/db";
import { toEditorBlock, type EditorBlock, type EditorProfile, type EditorSocials } from "./types";

export async function getEditorData(
  userId: string,
): Promise<{ profile: EditorProfile; blocks: EditorBlock[]; socials: EditorSocials; sparklines: Record<string, number[]> } | null> {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: { blocks: { orderBy: { position: "asc" } }, socials: true },
  });
  if (!profile) return null;
  const sparklines = await getBlockSparklines(profile);
  return {
    sparklines,
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
