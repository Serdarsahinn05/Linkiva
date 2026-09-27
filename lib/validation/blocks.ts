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

/**
 * A comma-separated list as the editor keeps it ("next.js, postgres"): trimmed, de-duplicated (case-insensitive) and
 * bounded; stored back as "a, b, c". Empty items are dropped.
 */
export function splitList(value: string | undefined): string[] {
  const seen = new Set<string>();
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => item && !seen.has(item.toLocaleLowerCase("tr")) && seen.add(item.toLocaleLowerCase("tr")));
}

const list = (maxItems: number, maxLength: number, min = 0) =>
  z
    .string()
    .max(4000)
    .optional()
    .transform((value, ctx) => {
      const items = splitList(value);
      if (items.length < min || items.length > maxItems || items.some((i) => i.length > maxLength)) {
        ctx.addIssue({ code: "custom", message: "list" });
        return z.NEVER;
      }
      return items.length ? items.join(", ") : undefined;
    });

/** A month or a year ("2024-06", "2024"), for experience dates. */
const yearMonth = z
  .string()
  .trim()
  .regex(/^(19|20)\d{2}(-(0[1-9]|1[0-2]))?$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

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
  // Portfolio blocks (ROADMAP Faz 12). A project links to its live page (url) and/or its code (repo); the card goes to
  // url when there is one, and repo gets its own small link. stars: read once from GitHub on import, never live.
  PROJECT: z.object({
    title: z.string().trim().min(1).max(TITLE_MAX),
    desc: z.string().trim().max(DESC_MAX).optional(),
    url: optionalUrl,
    repo: optionalUrl,
    img: z.union([z.literal(""), z.string().max(2048).refine(isBlobStoreUrl, "img")]).optional(),
    tags: list(8, 24),
    stars: z.string().regex(/^\d{1,7}$/).optional().or(z.literal("").transform(() => undefined)),
  }),
  // One job or school; consecutive ones read as a timeline. No end date means "now".
  EXPERIENCE: z
    .object({
      role: z.string().trim().min(1).max(TITLE_MAX),
      org: z.string().trim().max(TITLE_MAX).optional(),
      start: yearMonth,
      end: yearMonth,
      desc: z.string().trim().max(300).optional(),
    })
    .refine((d) => !d.start || !d.end || d.start <= d.end, "dates"),
  // A labelled group of skills. Deliberately no levels or percentages: they claim a precision nobody has.
  SKILLS: z.object({ title: z.string().trim().max(40).optional(), items: list(30, 32, 1) }),
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
  "PROJECT",
  "EXPERIENCE",
  "SKILLS",
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
  PROJECT: { title: "", desc: "", url: "", repo: "", tags: "" },
  EXPERIENCE: { role: "", org: "", start: "", end: "", desc: "" },
  SKILLS: { title: "", items: "" },
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
  PROJECT: ["SMALL", "WIDE", "LARGE"],
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
