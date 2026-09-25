import { z } from "zod";
import type { BlockType } from "@/prisma/generated/enums";
import { parseEmbed } from "@/lib/embeds";
import { isBlobStoreUrl } from "@/lib/uploads";
import { normalizeUrl } from "./url";

export const TITLE_MAX = 80;
export const TEXT_MAX = 500;
export const ALT_MAX = 150;
export const DESC_MAX = 200;

const url = z.string().transform((value, ctx) => {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: "url" });
    return z.NEVER;
  }
  return normalized;
});

/** An optional destination: empty means "none", anything else must be a safe URL. */
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const normalized = normalizeUrl(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "url" });
      return z.NEVER;
    }
    return normalized;
  });

/** Pixel size kept as a string (Block.data is a string map in the editor). */
const pixels = z.string().regex(/^[1-9]\d{0,4}$/).optional();

/** Block.data shape per BlockType. Every read and write of Block.data goes through these. */
export const blockDataSchemas = {
  // card: shown as a preview card (desc + img read from the page by the owner's request, img copied to our Blob).
  LINK: z.object({
    title: z.string().trim().min(1).max(TITLE_MAX),
    url,
    card: z.enum(["1", ""]).optional(),
    desc: z.string().trim().max(DESC_MAX).optional(),
    img: z.union([z.literal(""), z.string().max(2048).refine(isBlobStoreUrl, "img")]).optional(),
  }),
  HEADER: z.object({ text: z.string().trim().min(1).max(TITLE_MAX) }),
  TEXT: z.object({ text: z.string().trim().min(1).max(TEXT_MAX) }),
  DIVIDER: z.object({}),
  // Only YouTube / Spotify / SoundCloud URLs that lib/embeds.ts understands.
  EMBED: z.object({ url: z.string().trim().max(2048).refine((v) => parseEmbed(v) !== null, "embed") }),
  EMAIL_CAPTURE: z.object({ title: z.string().trim().max(TITLE_MAX).optional() }),
  // src must be a file on our Blob store; the editor action further pins it to the owner's own folder.
  // title is the optional caption; w/h reserve the image's space so the page does not jump while it loads.
  IMAGE: z.object({
    src: z.string().max(2048).refine(isBlobStoreUrl, "src"),
    alt: z.string().trim().max(ALT_MAX).optional(),
    title: z.string().trim().max(TITLE_MAX).optional(),
    url: optionalUrl,
    w: pixels,
    h: pixels,
  }),
} satisfies Record<BlockType, z.ZodType>;

export type BlockData = { [K in BlockType]: z.output<(typeof blockDataSchemas)[K]> };

/** Types the editor can create today. */
export const EDITABLE_BLOCK_TYPES = ["LINK", "HEADER", "TEXT", "IMAGE", "EMBED", "EMAIL_CAPTURE", "DIVIDER"] as const satisfies readonly BlockType[];
export type EditableBlockType = (typeof EDITABLE_BLOCK_TYPES)[number];

/** Placeholder content for a freshly added block, so it is valid from the first render. */
export const blockDefaults: Record<EditableBlockType, Record<string, string>> = {
  LINK: { title: "", url: "" },
  HEADER: { text: "" },
  TEXT: { text: "" },
  IMAGE: { src: "", alt: "", title: "", url: "" },
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
