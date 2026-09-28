import { del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isOwnBlobUrl } from "@/lib/uploads";
import { appearanceSchema } from "@/themes";

// Looser than usernameSchema on purpose: a name taken before it became reserved must still be removable.
const username = z.string().trim().toLowerCase().min(1).max(64);

/**
 * Notice-and-takedown until the admin panel exists (ROADMAP Faz 14 → Faz 19). Called only by app/api/takedown
 * (TAKEDOWN_SECRET), never from the UI. Each action removes the reported content and the uploaded files behind it;
 * the caller refreshes the profile's cache. Unpublishing is a stop-gap: the owner can publish again (suspension
 * comes with Faz 19).
 */
export const takedownSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("unpublish"), username }),
  z.object({ action: z.literal("remove-images"), username }),
  z.object({ action: z.literal("remove-block"), blockId: z.string().trim().min(1).max(64) }),
]);

export type TakedownInput = z.infer<typeof takedownSchema>;
export type TakedownResult = { ok: true; username: string; removedFiles: number } | { ok: false; error: "notFound" };

/** Deletes our own uploads among `urls` (only files in that user's folder of our Blob store). */
async function deleteFiles(urls: (string | null | undefined)[], userId: string) {
  const own = urls.filter((u): u is string => typeof u === "string" && isOwnBlobUrl(u, userId));
  if (!own.length || !env.BLOB_READ_WRITE_TOKEN) return 0;
  await del(own, { token: env.BLOB_READ_WRITE_TOKEN });
  return own.length;
}

export async function takedown(input: TakedownInput): Promise<TakedownResult> {
  if (input.action === "remove-block") {
    const block = await db.block.findUnique({ where: { id: input.blockId }, select: { data: true, profile: { select: { username: true, userId: true } } } });
    if (!block) return { ok: false, error: "notFound" };
    // Any string field may hold an upload (IMAGE src, card img of LINK/PRODUCT/PROJECT).
    const data = block.data && typeof block.data === "object" && !Array.isArray(block.data) ? Object.values(block.data) : [];
    // Files first: the upload is the hosted content, and a retry still finds the block if the delete below fails.
    const removedFiles = await deleteFiles(data.filter((v) => typeof v === "string"), block.profile.userId);
    await db.block.delete({ where: { id: input.blockId } });
    return { ok: true, username: block.profile.username, removedFiles };
  }

  const profile = await db.profile.findUnique({ where: { username: input.username }, select: { id: true, userId: true, avatarUrl: true, appearance: true } });
  if (!profile) return { ok: false, error: "notFound" };

  if (input.action === "unpublish") {
    await db.profile.update({ where: { id: profile.id }, data: { isPublished: false } });
    return { ok: true, username: input.username, removedFiles: 0 };
  }

  // remove-images: profile photo and background image.
  const appearance = appearanceSchema.safeParse(profile.appearance).data ?? {};
  const removedFiles = await deleteFiles([profile.avatarUrl, appearance.backgroundUrl], profile.userId);
  await db.profile.update({ where: { id: profile.id }, data: { avatarUrl: null, appearance: { ...appearance, backgroundUrl: undefined } } });
  return { ok: true, username: input.username, removedFiles };
}
