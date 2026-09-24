"use server";

import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { isOwnBlobUrl } from "@/lib/uploads";
import { profileTag } from "@/features/profile/public";
import { appearanceSchema, THEME_KEYS } from "@/themes";

const inputSchema = z.object({
  theme: z.enum(THEME_KEYS),
  appearance: appearanceSchema,
  showBranding: z.boolean(),
});

export type AppearanceInput = z.infer<typeof inputSchema>;
export type AppearanceResult = { ok: true } | { ok: false; error: "unauthorized" | "invalid" | "unknown" };

/** Saves theme + overrides. A background image must live in the caller's own blob folder. */
export async function updateAppearance(input: AppearanceInput): Promise<AppearanceResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  try {
    const user = await requireUser();
    const background = parsed.data.appearance.backgroundUrl ?? null;
    if (background && !isOwnBlobUrl(background, user.id)) return { ok: false, error: "invalid" };

    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true, appearance: true } });
    if (!profile) return { ok: false, error: "unauthorized" };

    await db.profile.update({
      where: { id: profile.id },
      data: { theme: parsed.data.theme, appearance: parsed.data.appearance, showBranding: parsed.data.showBranding },
    });

    // A replaced or removed background image is deleted from storage.
    const previous = appearanceSchema.safeParse(profile.appearance).data?.backgroundUrl ?? null;
    if (previous && previous !== background && env.BLOB_READ_WRITE_TOKEN && isOwnBlobUrl(previous, user.id)) {
      await del(previous, { token: env.BLOB_READ_WRITE_TOKEN }).catch((error) => console.error("old background delete failed", error));
    }

    updateTag(profileTag(profile.username));
    return { ok: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    console.error("updateAppearance failed", error);
    return { ok: false, error: "unknown" };
  }
}
