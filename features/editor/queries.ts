import { db } from "@/lib/db";
import type { EditorBlock, EditorProfile, EditorSocials } from "./types";

export async function getEditorData(userId: string): Promise<{ profile: EditorProfile; blocks: EditorBlock[]; socials: EditorSocials } | null> {
  const profile = await db.profile.findUnique({
    where: { userId },
    include: { blocks: { orderBy: { position: "asc" } }, socials: true },
  });
  if (!profile) return null;
  return {
    profile: {
      username: profile.username,
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      avatarUrl: profile.avatarUrl,
      theme: profile.theme,
      showBranding: profile.showBranding,
    },
    blocks: profile.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      data: (b.data ?? {}) as Record<string, string>,
      isVisible: b.isVisible,
      isHighlighted: b.isHighlighted,
    })),
    socials: Object.fromEntries(profile.socials.map((s) => [s.platform, s.handle])),
  };
}
