import type { BlockType, SocialPlatform } from "@/prisma/generated/enums";

/** A block as the editor holds it: data may be an unfinished draft. */
export type EditorBlock = {
  id: string;
  type: BlockType;
  data: Record<string, string>;
  isVisible: boolean;
  isHighlighted: boolean;
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
