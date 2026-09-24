"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";
import { requireUser } from "@/lib/session";
import { emailSchema } from "@/lib/validation/auth";
import { isLive } from "@/lib/schedule";

export type SubscribeState = { status: "idle" | "done" | "invalid" | "tooMany" | "error" };

const formSchema = z.object({
  blockId: z.string().min(1).max(40),
  email: emailSchema,
  // Honeypot: a field humans never see. Anything in it means a bot.
  website: z.string().max(0).optional(),
});

/**
 * Public EMAIL_CAPTURE submission. Works as a plain form post (no JS). Duplicate subscriptions look
 * like success, so the form never reveals who is already on a list.
 */
export async function subscribe(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const parsed = formSchema.safeParse({
    blockId: formData.get("blockId"),
    email: formData.get("email"),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) {
    // A filled honeypot gets a fake success; a bad address gets a real error.
    return { status: formData.get("website") ? "done" : "invalid" };
  }

  const ip = clientIp(await headers());
  if (!(await allow("subscribe", ip, 5, 600))) return { status: "tooMany" };

  const block = await db.block.findUnique({
    where: { id: parsed.data.blockId },
    select: { type: true, isVisible: true, startsAt: true, endsAt: true, profile: { select: { id: true, isPublished: true } } },
  });
  const open =
    block?.type === "EMAIL_CAPTURE" &&
    block.isVisible &&
    block.profile.isPublished &&
    isLive({ startsAt: block.startsAt?.toISOString() ?? null, endsAt: block.endsAt?.toISOString() ?? null });
  if (!open) return { status: "error" };

  try {
    await db.subscriber.create({ data: { profileId: block.profile.id, email: parsed.data.email } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      console.error("subscribe failed", error);
      return { status: "error" };
    }
  }
  return { status: "done" };
}

/** Owner removes a subscriber from their own list. */
export async function removeSubscriber(id: string): Promise<{ ok: boolean }> {
  try {
    const user = await requireUser();
    const { count } = await db.subscriber.deleteMany({ where: { id, profile: { userId: user.id } } });
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}
