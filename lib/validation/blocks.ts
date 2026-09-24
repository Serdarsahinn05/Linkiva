import { z } from "zod";
import type { BlockType } from "@/prisma/generated/enums";
import { parseEmbed } from "@/lib/embeds";
import { normalizeUrl } from "./url";

export const TITLE_MAX = 80;
export const TEXT_MAX = 500;

const url = z.string().transform((value, ctx) => {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: "url" });
    return z.NEVER;
  }
  return normalized;
});

/** Block.data shape per BlockType. Every read and write of Block.data goes through these. */
export const blockDataSchemas = {
  LINK: z.object({ title: z.string().trim().min(1).max(TITLE_MAX), url }),
  HEADER: z.object({ text: z.string().trim().min(1).max(TITLE_MAX) }),
  TEXT: z.object({ text: z.string().trim().min(1).max(TEXT_MAX) }),
  DIVIDER: z.object({}),
  // Only YouTube / Spotify / SoundCloud URLs that lib/embeds.ts understands.
  EMBED: z.object({ url: z.string().trim().max(2048).refine((v) => parseEmbed(v) !== null, "embed") }),
  EMAIL_CAPTURE: z.object({ title: z.string().trim().max(TITLE_MAX).optional() }),
} satisfies Record<BlockType, z.ZodType>;

export type BlockData = { [K in BlockType]: z.output<(typeof blockDataSchemas)[K]> };

/** Types the editor can create today. */
export const EDITABLE_BLOCK_TYPES = ["LINK", "HEADER", "TEXT", "EMBED", "EMAIL_CAPTURE", "DIVIDER"] as const satisfies readonly BlockType[];
export type EditableBlockType = (typeof EDITABLE_BLOCK_TYPES)[number];

/** Placeholder content for a freshly added block, so it is valid from the first render. */
export const blockDefaults: Record<EditableBlockType, Record<string, string>> = {
  LINK: { title: "", url: "" },
  HEADER: { text: "" },
  TEXT: { text: "" },
  EMBED: { url: "" },
  EMAIL_CAPTURE: { title: "" },
  DIVIDER: {},
};

export type ParsedBlock = { [K in BlockType]: { type: K; data: BlockData[K] } }[BlockType];

/** Parses a stored block; invalid or unfinished data returns null (the block is not rendered publicly). */
export function parseBlock(type: BlockType, data: unknown): ParsedBlock | null {
  const result = blockDataSchemas[type].safeParse(data);
  return result.success ? ({ type, data: result.data } as ParsedBlock) : null;
}
