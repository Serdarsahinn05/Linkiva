"use server";

import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { z } from "zod";
import { BlockType, SocialPlatform } from "@/prisma/generated/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { normalizeSocial } from "@/lib/socials";
import { isOwnBlobUrl } from "@/lib/uploads";
import { blockDataSchemas, blockDefaults, EDITABLE_BLOCK_TYPES, TEXT_MAX, TITLE_MAX } from "@/lib/validation/blocks";
import { profileTag } from "@/features/profile/public";
import type { EditorBlock } from "./types";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: "unauthorized" | "invalid" | "notFound" | "unknown" };

const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: "unauthorized" | "invalid" | "notFound" | "unknown"): ActionResult<never> => ({ ok: false, error });

/**
 * Every mutation runs through here: resolves the caller's own profile, runs the body, then
 * invalidates the public profile cache. Ownership is enforced by always filtering on this profile's id
 * (v1 bug S1: updates by bare id let any user edit anyone's links).
 */
async function withProfile<T>(body: (profile: { id: string; username: string }) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    const user = await requireUser();
    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true } });
    if (!profile) return fail("notFound");
    const result = await body(profile);
    if (result.ok) updateTag(profileTag(profile.username));
    return result;
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("unauthorized");
    console.error("editor action failed", error);
    return fail("unknown");
  }
}

const toEditorBlock = (b: { id: string; type: BlockType; data: unknown; isVisible: boolean; isHighlighted: boolean }): EditorBlock => ({
  id: b.id,
  type: b.type,
  data: (b.data ?? {}) as Record<string, string>,
  isVisible: b.isVisible,
  isHighlighted: b.isHighlighted,
});

// ─── Blocks ──────────────────────────────────────────────────────────────────

export async function addBlock(type: string): Promise<ActionResult<EditorBlock>> {
  const parsed = z.enum(EDITABLE_BLOCK_TYPES).safeParse(type);
  if (!parsed.success) return fail("invalid");
  return withProfile(async (profile) => {
    // New blocks go on top, where the user is looking.
    const first = await db.block.findFirst({ where: { profileId: profile.id }, orderBy: { position: "asc" }, select: { position: true } });
    const block = await db.block.create({
      data: { profileId: profile.id, type: parsed.data, position: (first?.position ?? 1) - 1, data: blockDefaults[parsed.data] },
    });
    return ok(toEditorBlock(block));
  });
}

/** Drafts may be incomplete (empty title while typing); they are stored but not rendered publicly. */
// partialRecord: in zod 4, z.record with enum keys would require every key.
const draftSchema = z.partialRecord(z.enum(["title", "url", "text"]), z.string().max(Math.max(TEXT_MAX, 2048)));

export async function updateBlock(id: string, data: unknown): Promise<ActionResult<EditorBlock>> {
  const draft = draftSchema.safeParse(data);
  if (!draft.success || (draft.data.title?.length ?? 0) > TITLE_MAX) return fail("invalid");
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id }, select: { type: true } });
    if (!block) return fail("notFound");
    // Store the normalised form when the block is complete, the raw draft otherwise.
    const complete = blockDataSchemas[block.type].safeParse(draft.data);
    const updated = await db.block.update({ where: { id }, data: { data: complete.success ? complete.data : draft.data } });
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

export type DeletedBlock = { id: string; type: BlockType; data: unknown; position: number; isVisible: boolean; isHighlighted: boolean };

export async function deleteBlock(id: string): Promise<ActionResult<DeletedBlock>> {
  return withProfile(async (profile) => {
    const block = await db.block.findFirst({ where: { id, profileId: profile.id } });
    if (!block) return fail("notFound");
    await db.block.delete({ where: { id } });
    return ok({ id: block.id, type: block.type, data: block.data, position: block.position, isVisible: block.isVisible, isHighlighted: block.isHighlighted });
  });
}

/** Undo for deleteBlock: recreates the block (same id) on the caller's own profile. */
export async function restoreBlock(snapshot: DeletedBlock): Promise<ActionResult<EditorBlock>> {
  const parsed = z
    .object({
      id: z.string().min(1).max(40),
      type: z.enum(BlockType),
      data: z.unknown(),
      position: z.number().int(),
      isVisible: z.boolean(),
      isHighlighted: z.boolean(),
    })
    .safeParse(snapshot);
  if (!parsed.success) return fail("invalid");
  const draft = draftSchema.safeParse(parsed.data.data);
  if (!draft.success) return fail("invalid");
  return withProfile(async (profile) => {
    const block = await db.block.create({ data: { ...parsed.data, data: draft.data, profileId: profile.id } });
    return ok(toEditorBlock(block));
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
