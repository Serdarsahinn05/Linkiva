"use server";

import { del, list, put } from "@vercel/blob";
import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { BlockSize, BlockType, SocialPlatform } from "@/prisma/generated/enums";
import { toCardWebp } from "@/lib/card-image";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { normalizeSocial } from "@/lib/socials";
import { channelIdFromHtml, YOUTUBE_HOSTS, youtubeChannel } from "@/lib/embeds";
import { fetchPage, getLinkPreview } from "@/lib/link-preview";
import { allow } from "@/lib/ratelimit";
import { blockImagePrefix, isOwnBlobUrl } from "@/lib/uploads";
import { displayHost, normalizeUrl } from "@/lib/validation/url";
import { allowedSizes, blockDataSchemas, blockDefaults, DESC_MAX, EDITABLE_BLOCK_TYPES, TEXT_MAX, TITLE_MAX } from "@/lib/validation/blocks";
import { fetchLatestVideo } from "@/features/profile/latest-video";
import { profileTag } from "@/features/profile/public";
import { TEMPLATE_KEYS, TEMPLATES } from "./templates";
import { toEditorBlock, type EditorBlock } from "./types";

type ActionError = "unauthorized" | "invalid" | "notFound" | "unknown" | "unreachable" | "tooMany";
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError };

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: ActionError): ActionResult<never> => ({ ok: false, error });

/**
 * Every mutation runs through here: resolves the caller's own profile, runs the body, then
 * invalidates the public profile cache. Ownership is enforced by always filtering on this profile's id
 * (v1 bug S1: updates by bare id let any user edit anyone's links).
 */
async function withProfile<T>(body: (profile: { id: string; username: string; userId: string }) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const user = await requireUser();
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true } });
    if (!profile) return fail("notFound");
    const result = await body({ ...profile, userId: user.id });
    if (result.ok) updateTag(profileTag(profile.username));
    return result;
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("unauthorized");
    console.error("editor action failed", error);
    return fail("unknown");
  }
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

/**
 * Adds a block on top. `prefill` (smart paste) is only for links, embeds and WhatsApp, and only when it is already a complete,
 * valid block; everything else starts from the empty defaults.
 */
export async function addBlock(type: string, prefill?: unknown): Promise<ActionResult<EditorBlock>> {
  const parsed = z.enum(EDITABLE_BLOCK_TYPES).safeParse(type);
  if (!parsed.success) return fail("invalid");
  const complete =
    prefill === undefined
      ? null
      : parsed.data === "LINK"
        ? blockDataSchemas.LINK.safeParse(prefill)
        : parsed.data === "EMBED"
          ? blockDataSchemas.EMBED.safeParse(prefill)
          : parsed.data === "WHATSAPP"
            ? blockDataSchemas.WHATSAPP.safeParse(prefill)
            : undefined;
  if (complete === undefined || (complete && !complete.success)) return fail("invalid");
  const data = complete?.data ?? blockDefaults[parsed.data];
  return withProfile(async (profile) => {
    // New blocks go on top, where the user is looking.
    const first = await db.block.findFirst({ where: { profileId: profile.id }, orderBy: { position: "asc" }, select: { position: true } });
    const block = await db.block.create({ data: { profileId: profile.id, type: parsed.data, position: (first?.position ?? 1) - 1, data } });
    return ok(toEditorBlock(block));
  });
}

/** Adds a starter page's blocks after the existing ones, in the owner's language (features/editor/templates.ts). */
export async function applyTemplate(key: string): Promise<ActionResult<EditorBlock[]>> {
  const parsed = z.enum(TEMPLATE_KEYS).safeParse(key);
  if (!parsed.success) return fail("invalid");
  const t = await getTranslations("templates.blocks");
  // The texts are a plain string array per template (see messages/*.json).
  const texts = t.raw(parsed.data) as string[];
  const types = TEMPLATES[parsed.data];
  return withProfile(async (profile) => {
    const last = await db.block.findFirst({ where: { profileId: profile.id }, orderBy: { position: "desc" }, select: { position: true } });
    const start = (last?.position ?? -1) + 1;
    const blocks = await db.block.createManyAndReturn({
      data: types.map((type, i) => {
        const text = texts[i] ?? "";
        const data =
          type === "LINK"
            ? { title: text, url: "" }
            : type === "EMAIL_CAPTURE"
              ? { title: text }
              : type === "HEADER" || type === "TEXT"
                ? { text }
                : blockDefaults[type];
        return { profileId: profile.id, type, position: start + i, data };
      }),
    });
    return ok(blocks.sort((a, b) => a.position - b.position).map(toEditorBlock));
  });
}

/** Drafts may be incomplete (empty title while typing); they are stored but not rendered publicly. */
// partialRecord: in zod 4, z.record with enum keys would require every key.
const draftSchema = z.partialRecord(z.enum([
    "title",
    "url",
    "text",
    "src",
    "alt",
    "w",
    "h",
    "card",
    "desc",
    "img",
    "gate",
    "collapsible",
    "name",
    "iban",
    "note",
    "urlLabel",
    "phone",
    "message",
    "org",
    "email",
    "website",
    "price",
    "sponsored",
    "target",
    "after",
    "afterText",
    "latest",
    "channelId",
    "repo",
    "tags",
    "stars",
    "role",
    "org",
    "start",
    "end",
    "items",
  ]), z.string().max(Math.max(TEXT_MAX, 2048)));

/** Block images (Image block src, link card img) may only be files in the owner's own Blob folder. */
const foreignImage = (data: { src?: string; img?: string }, userId: string) =>
  [data.src, data.img].some((file) => Boolean(file) && !isOwnBlobUrl(file!, userId));

const blockFiles = (data: unknown) => {
  const d = (data ?? {}) as { src?: string; img?: string };
  return [d.src, d.img].filter((file): file is string => Boolean(file));
};

/**
 * Deletes Image-block files that no block of this profile uses any more (replaced or deleted images).
 * Runs when a new image is set, so a deleted block's file survives its undo window.
 */
async function collectBlockImages(profileId: string, userId: string) {
  if (!env.BLOB_READ_WRITE_TOKEN) return;
  const blocks = await db.block.findMany({ where: { profileId, type: { in: ["IMAGE", "LINK"] } }, select: { data: true } });
  const used = new Set(blocks.flatMap((b) => blockFiles(b.data)));
  const { blobs } = await list({ prefix: blockImagePrefix(userId), token: env.BLOB_READ_WRITE_TOKEN });
  const unused = blobs.map((b) => b.url).filter((url) => !used.has(url));
  if (unused.length) await del(unused, { token: env.BLOB_READ_WRITE_TOKEN });
}

export async function updateBlock(id: string, data: unknown): Promise<ActionResult<EditorBlock>> {
  const draft = draftSchema.safeParse(data);
  if (!draft.success || (draft.data.title?.length ?? 0) > TITLE_MAX) return fail("invalid");
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id }, select: { type: true, data: true } });
    if (!block) return fail("notFound");
    if (foreignImage(draft.data, profile.userId)) return fail("invalid");
    // Store the normalised form when the block is complete, the raw draft otherwise.
    const complete = blockDataSchemas[block.type].safeParse(draft.data);
    const updated = await db.block.update({ where: { id }, data: { data: complete.success ? complete.data : draft.data } });
    const [before, after] = [blockFiles(block.data), blockFiles(draft.data)];
    // Only when the block's files changed (a new photo or card image), not on every autosaved keystroke.
    if (before.length !== after.length || before.some((file) => !after.includes(file))) {
      await collectBlockImages(profile.id, profile.userId).catch((error) => console.error("block image cleanup failed", error));
    }
    return ok(toEditorBlock(updated));
  });
}

/**
 * Turns a link into a preview card: reads the page's title, description and image once (SSRF-guarded,
 * lib/link-preview.ts) and copies the image to the owner's Blob folder, so visitors never load it from the
 * other site. The owner's own title is kept; the page's title only fills an empty one.
 */
export async function fetchLinkCard(id: string, rawUrl: string): Promise<ActionResult<EditorBlock>> {
  const url = typeof rawUrl === "string" ? normalizeUrl(rawUrl) : null;
  if (!url || !/^https?:/.test(url)) return fail("invalid");
  return withProfile(async (profile) => {
    // Link cards and product cards read the page the same way.
    const block = await db.block.findFirst({ where: { id, profileId: profile.id, type: { in: ["LINK", "PRODUCT", "PROJECT"] } }, select: { data: true, type: true } });
    if (!block) return fail("notFound");
    if (!(await allow("link-card", profile.userId, 10, 60))) return fail("tooMany");

    const preview = await getLinkPreview(url);
    if (!preview) return fail("unreachable");

    let img = "";
    // Stored as a resized WebP: the card image is often the profile's largest paint (Lighthouse LCP).
    const webp = preview.imageFile && env.BLOB_READ_WRITE_TOKEN ? await toCardWebp(preview.imageFile.bytes) : null;
    if (webp) {
      const stored = await put(`${blockImagePrefix(profile.userId)}${id}-card.webp`, webp, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: true,
        token: env.BLOB_READ_WRITE_TOKEN,
      });
      img = stored.url;
    }

    const current = draftSchema.safeParse(block.data).data ?? {};
    const next = {
      ...current,
      // A project reads its live page or its repository; neither replaces the addresses the owner typed.
      ...(block.type !== "PROJECT" && { url }),
      title: current.title?.trim() || (preview.title ?? displayHost(url)).slice(0, TITLE_MAX),
      ...(block.type === "LINK" && { card: "1" }),
      desc: (preview.description ?? "").slice(0, DESC_MAX),
      img,
    };
    const complete = blockDataSchemas[block.type].safeParse(next);
    const updated = await db.block.update({ where: { id }, data: { data: complete.success ? complete.data : next } });
    await collectBlockImages(profile.id, profile.userId).catch((error) => console.error("block image cleanup failed", error));
    return ok(toEditorBlock(updated));
  });
}

/**
 * Turns an embed into "the channel's latest video": finds the channel id once, now (from the address, or by reading the
 * channel page through the SSRF guard, YouTube hosts only), and checks the channel's feed has a video to show.
 */
export async function resolveLatestVideo(id: string, rawUrl: string): Promise<ActionResult<EditorBlock>> {
  const channel = typeof rawUrl === "string" ? youtubeChannel(rawUrl) : null;
  if (!channel) return fail("invalid");
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id, type: "EMBED" }, select: { id: true } });
    if (!block) return fail("notFound");
    if (!(await allow("latest-video", profile.userId, 10, 60))) return fail("tooMany");

    let channelId = channel.channelId ?? null;
    if (!channelId) {
      // SOCS: past YouTube's EU consent screen, which would otherwise stand in for the channel page.
      const page = await fetchPage(channel.url, { hosts: YOUTUBE_HOSTS, maxBytes: 1024 * 1024, cookie: "SOCS=CAI" });
      channelId = page ? channelIdFromHtml(page.html) : null;
    }
    if (!channelId || !(await fetchLatestVideo(channelId, false))) return fail("unreachable");

    const updated = await db.block.update({ where: { id }, data: { data: { url: channel.url, latest: "1", channelId } } });
    return ok(toEditorBlock(updated));
  });
}

export async function setBlockFlags(id: string, flags: { isVisible?: boolean; isHighlighted?: boolean }): Promise<ActionResult> {
  const parsed = z.object({ isVisible: z.boolean().optional(), isHighlighted: z.boolean().optional() }).strict().safeParse(flags);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    const { count } = await db.block.updateMany({ where: { id, profileId: profile.id }, data: parsed.data });
    return count ? ok(undefined) : fail("notFound");
  });
}

/** Grid layout tile size; only sizes the block's type allows (lib/validation/blocks.ts → allowedSizes). */
export async function setBlockSize(id: string, size: string): Promise<ActionResult> {
  const parsed = z.enum(BlockSize).safeParse(size);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id }, select: { type: true } });
    if (!block) return fail("notFound");
    if (!allowedSizes(block.type).includes(parsed.data)) return fail("invalid");
    await db.block.update({ where: { id }, data: { size: parsed.data } });
    return ok(undefined);
  });
}

/** Scheduled publishing: show a block only between startsAt and endsAt (either may be open). */
export async function setBlockSchedule(id: string, schedule: { startsAt: string | null; endsAt: string | null }): Promise<ActionResult> {
  const parsed = z
    .object({ startsAt: z.iso.datetime({ offset: true }).nullable(), endsAt: z.iso.datetime({ offset: true }).nullable() })
    .refine((s) => !s.startsAt || !s.endsAt || Date.parse(s.startsAt) < Date.parse(s.endsAt), "order")
    .safeParse(schedule);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    const { count } = await db.block.updateMany({
      where: { id, profileId: profile.id },
      data: { startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null, endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null },
    });
    return count ? ok(undefined) : fail("notFound");
  });
}

export type DeletedBlock = { id: string; type: BlockType; data: unknown; position: number; isVisible: boolean; isHighlighted: boolean; size: BlockSize; startsAt: string | null; endsAt: string | null };

const snapshotOf = (block: { id: string; type: BlockType; data: unknown; position: number; isVisible: boolean; isHighlighted: boolean; size: BlockSize; startsAt: Date | null; endsAt: Date | null }): DeletedBlock => ({
  id: block.id,
  type: block.type,
  data: block.data,
  position: block.position,
  isVisible: block.isVisible,
  isHighlighted: block.isHighlighted,
  size: block.size,
  startsAt: block.startsAt?.toISOString() ?? null,
  endsAt: block.endsAt?.toISOString() ?? null,
});

export async function deleteBlock(id: string): Promise<ActionResult<DeletedBlock>> {
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id } });
    if (!block) return fail("notFound");
    await db.block.delete({ where: { id } });
    return ok(snapshotOf(block));
  });
}

const idsSchema = z.array(z.string().min(1).max(40)).min(1).max(500);

/**
 * Deletes several of the caller's blocks at once ("delete all", undoing a template or an import) and returns them
 * for undo. Ids that are not the caller's are ignored, never deleted.
 */
export async function deleteBlocks(ids: string[]): Promise<ActionResult<DeletedBlock[]>> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    const blocks = await db.block.findMany({ where: { profileId: profile.id, id: { in: parsed.data } } });
    if (blocks.length === 0) return fail("notFound");
    await db.block.deleteMany({ where: { profileId: profile.id, id: { in: blocks.map((b) => b.id) } } });
    return ok(blocks.sort((a, b) => a.position - b.position).map(snapshotOf));
  });
}

const snapshotSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(BlockType),
  data: z.unknown(),
  position: z.number().int(),
  isVisible: z.boolean(),
  isHighlighted: z.boolean(),
  size: z.enum(BlockSize).default("WIDE"),
  startsAt: z.iso.datetime({ offset: true }).nullable(),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
});

/** A snapshot checked like any other write: draft fields only, and images only from the caller's own folder. */
function restorable(snapshot: unknown) {
  const parsed = snapshotSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const draft = draftSchema.safeParse(parsed.data.data);
  if (!draft.success) return null;
  const { startsAt, endsAt, ...rest } = parsed.data;
  return { ...rest, data: draft.data, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null };
}

/** Undo for deleteBlock: recreates the block (same id) on the caller's own profile. */
export async function restoreBlock(snapshot: DeletedBlock): Promise<ActionResult<EditorBlock>> {
  const block = restorable(snapshot);
  if (!block) return fail("invalid");
  return withProfile(async (profile) => {
    if (foreignImage(block.data, profile.userId)) return fail("invalid");
    return ok(toEditorBlock(await db.block.create({ data: { ...block, profileId: profile.id } })));
  });
}

/** Undo for deleteBlocks: recreates all of them (same ids and positions) on the caller's own profile, or none. */
export async function restoreBlocks(snapshots: DeletedBlock[]): Promise<ActionResult<EditorBlock[]>> {
  if (!Array.isArray(snapshots) || snapshots.length === 0 || snapshots.length > 500) return fail("invalid");
  const blocks = snapshots.map(restorable);
  if (blocks.some((b) => b === null)) return fail("invalid");
  const valid = blocks.filter((b): b is NonNullable<typeof b> => b !== null);
  if (new Set(valid.map((b) => b.id)).size !== valid.length) return fail("invalid");
  return withProfile(async (profile) => {
    if (valid.some((b) => foreignImage(b.data, profile.userId))) return fail("invalid");
    const created = await db.$transaction(valid.map((b) => db.block.create({ data: { ...b, profileId: profile.id } })));
    return ok(created.sort((a, b) => a.position - b.position).map(toEditorBlock));
  });
}

export async function reorderBlocks(ids: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().min(1).max(40)).max(500).safeParse(ids);
  if (!parsed.success || new Set(parsed.data).size !== parsed.data.length) return fail("invalid");
  return withProfile(async (profile) => {
    const owned = await db.block.count({ where: { profileId: profile.id, id: { in: parsed.data } } });
    const total = await db.block.count({ where: { profileId: profile.id } });
    // The list must be exactly this profile's blocks: no foreign ids, none missing.
    if (owned !== parsed.data.length || total !== parsed.data.length) return fail("invalid");
    await db.$transaction(parsed.data.map((id, position) => db.block.update({ where: { id }, data: { position } })));
    return ok(undefined);
  });
}

// ─── Profile header ──────────────────────────────────────────────────────────

const basicsSchema = z.object({
  displayName: z.string().trim().max(60),
  bio: z.string().trim().max(160),
});

export async function updateProfileBasics(input: { displayName: string; bio: string }): Promise<ActionResult> {
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    await db.profile.update({
      where: { id: profile.id },
      data: { displayName: parsed.data.displayName || null, bio: parsed.data.bio || null },
    });
    return ok(undefined);
  });
}

// ─── Socials ─────────────────────────────────────────────────────────────────

/** Empty value removes the platform. Returns the stored (normalised) value. */
export async function setSocial(platform: string, value: string): Promise<ActionResult<string | null>> {
  const parsedPlatform = z.enum(SocialPlatform).safeParse(platform);
  if (!parsedPlatform.success || typeof value !== "string" || value.length > 2048) return fail("invalid");
  const p = parsedPlatform.data;
  return withProfile(async (profile) => {
    if (!value.trim()) {
      await db.socialLink.deleteMany({ where: { profileId: profile.id, platform: p } });
      return ok(null);
    }
    const handle = normalizeSocial(p, value);
    if (!handle) return fail("invalid");
    await db.socialLink.upsert({
      where: { profileId_platform: { profileId: profile.id, platform: p } },
      create: { profileId: profile.id, platform: p, handle, position: 0 },
      update: { handle },
    });
    return ok(handle);
  });
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

/** Sets (or with null, removes) the avatar. Only URLs inside the caller's own blob folder are accepted. */
export async function setAvatar(url: string | null): Promise<ActionResult> {
  if (url !== null && typeof url !== "string") return fail("invalid");
  try {
    const user = await requireUser();
    if (url !== null && !isOwnBlobUrl(url, user.id)) return fail("invalid");
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true, avatarUrl: true } });
    if (!profile) return fail("notFound");
    await db.profile.update({ where: { id: profile.id }, data: { avatarUrl: url } });
    // Replaced files are deleted (v1 kept every upload forever).
    if (profile.avatarUrl && profile.avatarUrl !== url && env.BLOB_READ_WRITE_TOKEN && isOwnBlobUrl(profile.avatarUrl, user.id)) {
      await del(profile.avatarUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch((error) => console.error("old avatar delete failed", error));
    }
    updateTag(profileTag(profile.username));
    return ok(undefined);
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("unauthorized");
    console.error("setAvatar failed", error);
    return fail("unknown");
  }
}

// ─── Publishing & SEO ────────────────────────────────────────────────────────

const publishingSchema = z.object({
  isPublished: z.boolean(),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(160),
});

/** Unpublished profiles answer 404 publicly; SEO fields override the generated title/description. */
export async function updatePublishing(input: z.input<typeof publishingSchema>): Promise<ActionResult> {
  const parsed = publishingSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    await db.profile.update({
      where: { id: profile.id },
      data: { isPublished: parsed.data.isPublished, seoTitle: parsed.data.seoTitle || null, seoDescription: parsed.data.seoDescription || null },
    });
    return ok(undefined);
  });
}
