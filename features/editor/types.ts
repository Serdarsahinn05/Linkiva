import type { BlockSize, BlockType, SocialPlatform } from "@/prisma/generated/enums";

/** A block as the editor holds it: data may be an unfinished draft. */
export type EditorBlock = {
  id: string;
  type: BlockType;
  data: Record<string, string>;
  isVisible: boolean;
  isHighlighted: boolean;
  /** Tile size in the grid layout. */
  size: BlockSize;
  /** ISO strings; null = no limit. */
  startsAt: string | null;
  endsAt: string | null;
};

export type EditorProfile = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  theme: string;
  appearance: unknown;
  showBranding: boolean;
};

export type EditorSocials = Partial<Record<SocialPlatform, string>>;

/** A block destination that failed the daily link check (features/link-check); shown while the block still points there. */
export type LinkIssue = { url: string; checkedAt: string };

/** A stored block row in the editor's shape. */
export const toEditorBlock = (b: { id: string; type: BlockType; data: unknown; isVisible: boolean; isHighlighted: boolean; size: BlockSize; startsAt: Date | null; endsAt: Date | null }): EditorBlock => ({
  id: b.id,
  type: b.type,
  data: (b.data ?? {}) as Record<string, string>,
  isVisible: b.isVisible,
  isHighlighted: b.isHighlighted,
  size: b.size,
  startsAt: b.startsAt?.toISOString() ?? null,
  endsAt: b.endsAt?.toISOString() ?? null,
});
