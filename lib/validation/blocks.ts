import { z } from "zod";
import type { BlockSize, BlockType } from "@/prisma/generated/enums";
import { parseEmbed, YT_CHANNEL_ID } from "@/lib/embeds";
import { isBlobStoreUrl } from "@/lib/uploads";
import { normalizeIban } from "./iban";
import { normalizePhone } from "./phone";
import { normalizeUrl } from "./url";

export const TITLE_MAX = 80;
export const TEXT_MAX = 500;
export const ALT_MAX = 150;
export const DESC_MAX = 200;
export const NOTE_MAX = 140;
export const PRICE_MAX = 20;

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

/** An optional field that must normalise with `fn` when present (IBAN, phone). */
const optionalNormalized = (fn: (v: string) => string | null, message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const normalized = fn(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return normalized;
    });

const flag = z.enum(["1", ""]).optional();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  // collapsible: the blocks after it, up to the next header or divider, fold under it (<details>).
  HEADER: z.object({ text: z.string().trim().min(1).max(TITLE_MAX), collapsible: flag }),
  TEXT: z.object({ text: z.string().trim().min(1).max(TEXT_MAX) }),
  DIVIDER: z.object({}),
  // Only YouTube / Spotify / SoundCloud URLs that lib/embeds.ts understands. latest: the channel's newest video, read from
  // its feed when the page renders (features/profile/latest-video.ts); url is then the channel's address.
  EMBED: z
    .object({
      url: z.string().trim().max(2048),
      latest: flag,
      channelId: z.string().regex(YT_CHANNEL_ID).optional(),
    })
    .refine((d) => (d.latest === "1" ? Boolean(d.channelId) : parseEmbed(d.url) !== null), "embed"),
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
  // Contact and support blocks (ROADMAP Faz 8). Every target is rebuilt on the server from validated fields, never taken as a URL
  // except the optional support/product links, which go through the same scheme allow-list as links.
  SUPPORT: z
    .object({
      name: z.string().trim().min(1).max(60),
      iban: optionalNormalized(normalizeIban, "iban"),
      note: z.string().trim().max(NOTE_MAX).optional(),
      url: optionalUrl,
      urlLabel: z.string().trim().max(TITLE_MAX).optional(),
    })
    .refine((d) => d.iban || d.url, "empty"),
  WHATSAPP: z.object({
    phone: z.string().transform((value, ctx) => normalizePhone(value) ?? (ctx.addIssue({ code: "custom", message: "phone" }), z.NEVER)),
    message: z.string().trim().max(300).optional(),
    title: z.string().trim().max(TITLE_MAX).optional(),
  }),
  CONTACT: z
    .object({
      name: z.string().trim().min(1).max(60),
      title: z.string().trim().max(60).optional(),
      org: z.string().trim().max(60).optional(),
      phone: optionalNormalized(normalizePhone, "phone"),
      email: z
        .string()
        .trim()
        .max(254)
        .optional()
        .refine((v) => !v || EMAIL_RE.test(v), "email"),
      website: optionalUrl,
    })
    .refine((d) => d.phone || d.email || d.website, "empty"),
  PRODUCT: z.object({
    title: z.string().trim().min(1).max(TITLE_MAX),
    url,
    price: z.string().trim().max(PRICE_MAX).optional(),
    desc: z.string().trim().max(DESC_MAX).optional(),
    img: z.union([z.literal(""), z.string().max(2048).refine(isBlobStoreUrl, "img")]).optional(),
    // Paid or affiliate content is labelled on the card (Reklam Kurulu influencer guidance).
    sponsored: flag,
  }),
  COUNTDOWN: z.object({
    title: z.string().trim().min(1).max(TITLE_MAX),
    target: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "date"),
    // After the moment: hide the block, or show a line of text instead.
    after: z.enum(["hide", "text"]).default("hide"),
    afterText: z.string().trim().max(TITLE_MAX).optional(),
  }),
} satisfies Record<BlockType, z.ZodType>;

export type BlockData = { [K in BlockType]: z.output<(typeof blockDataSchemas)[K]> };

/** Types the editor can create today. */
export const EDITABLE_BLOCK_TYPES = [
  "LINK",
  "HEADER",
  "TEXT",
  "IMAGE",
  "EMBED",
  "EMAIL_CAPTURE",
  "DIVIDER",
  "SUPPORT",
  "WHATSAPP",
  "CONTACT",
  "PRODUCT",
  "COUNTDOWN",
] as const satisfies readonly BlockType[];
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
  SUPPORT: { name: "", iban: "", note: "", url: "", urlLabel: "" },
  WHATSAPP: { phone: "", message: "", title: "" },
  CONTACT: { name: "", title: "", org: "", phone: "", email: "", website: "" },
  PRODUCT: { title: "", url: "", price: "", sponsored: "" },
  COUNTDOWN: { title: "", target: "", after: "hide", afterText: "" },
};

export type ParsedBlock = { [K in BlockType]: { type: K; data: BlockData[K] } }[BlockType];

// ─── Grid layout (ROADMAP Faz 10) ─────────────────────────────────────────────

/**
 * Tile sizes a type may take in the grid layout; types not listed always take a full row. WIDE is always allowed,
 * because it is the default and looks like the list. Embeds and support cards stay full-width: a 16:9 player and an
 * IBAN with its copy button do not fit a square.
 */
const GRID_SIZES: Partial<Record<BlockType, readonly BlockSize[]>> = {
  LINK: ["SMALL", "WIDE", "LARGE"],
  IMAGE: ["SMALL", "WIDE", "LARGE"],
  PRODUCT: ["SMALL", "WIDE", "LARGE"],
  WHATSAPP: ["SMALL", "WIDE"],
  CONTACT: ["SMALL", "WIDE"],
};

export const allowedSizes = (type: BlockType): readonly BlockSize[] => GRID_SIZES[type] ?? ["WIDE"];

/** The size a block renders with: a stored size the type does not allow falls back to a full row. */
export const effectiveSize = (type: BlockType, size: BlockSize | undefined): BlockSize =>
  size && allowedSizes(type).includes(size) ? size : "WIDE";

/** Parses a stored block; invalid or unfinished data returns null (the block is not rendered publicly). */
export function parseBlock(type: BlockType, data: unknown): ParsedBlock | null {
  const result = blockDataSchemas[type].safeParse(data);
  return result.success ? ({ type, data: result.data } as ParsedBlock) : null;
}
