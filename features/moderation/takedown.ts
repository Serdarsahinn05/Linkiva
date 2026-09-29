import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { isOwnBlobUrl } from "@/lib/uploads";
import { appearanceSchema } from "@/themes";

// Content removal for the admin panel (features/admin/actions.ts), which checks who may do it and logs it. Files go
// first: the upload is the hosted content, and a retry still finds the record if the database step fails.

/** Deletes our own uploads among `urls` (only files in that user's folder of our Blob store). */
async function deleteFiles(urls: (string | null | undefined)[], userId: string) {
  const own = urls.filter((u): u is string => typeof u === "string" && isOwnBlobUrl(u, userId));
  if (!own.length || !env.BLOB_READ_WRITE_TOKEN) return 0;
  await del(own, { token: env.BLOB_READ_WRITE_TOKEN });
  return own.length;
}

/** One block, with any file it points to (IMAGE src, card image of LINK/PRODUCT/PROJECT). Null when it is gone. */
export async function removeBlockContent(blockId: string): Promise<{ removedFiles: number } | null> {
  const block = await db.block.findUnique({ where: { id: blockId }, select: { data: true, profile: { select: { userId: true } } } });
  if (!block) return null;
  const data = block.data && typeof block.data === "object" && !Array.isArray(block.data) ? Object.values(block.data) : [];
  const removedFiles = await deleteFiles(data.filter((v) => typeof v === "string"), block.profile.userId);
  await db.block.delete({ where: { id: blockId } });
  return { removedFiles };
}

/** The profile photo and the background image; the other appearance settings stay. Null when the page is gone. */
export async function removeProfileImages(profileId: string): Promise<{ removedFiles: number } | null> {
  const profile = await db.profile.findUnique({ where: { id: profileId }, select: { userId: true, avatarUrl: true, appearance: true } });
  if (!profile) return null;
  const appearance = appearanceSchema.safeParse(profile.appearance).data ?? {};
  const removedFiles = await deleteFiles([profile.avatarUrl, appearance.backgroundUrl], profile.userId);
  await db.profile.update({ where: { id: profileId }, data: { avatarUrl: null, appearance: { ...appearance, backgroundUrl: undefined } } });
  return { removedFiles };
}
