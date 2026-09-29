"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { ReportReason } from "@/prisma/generated/enums";
import { db } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";
import { emailSchema } from "@/lib/validation/auth";

export type ReportState = { status: "idle" | "done" | "invalid" | "tooMany" | "error" };

const formSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  blockId: z.string().trim().min(1).max(40).optional(),
  reason: z.enum(ReportReason),
  details: z.string().trim().max(1000).optional(),
  email: emailSchema.optional(),
  // Honeypot: a field humans never see. Anything in it means a bot.
  website: z.string().max(0).optional(),
});

const blank = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v : undefined);

/**
 * A visitor reports a published page (or one block on it). Anonymous; the email is optional and only for a reply.
 * Works as a plain form post. Limited per address (5 an hour, 2 a day for the same page) so the queue cannot be
 * flooded, and a filled honeypot gets a fake success.
 */
export async function submitReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const parsed = formSchema.safeParse({
    username: formData.get("username"),
    blockId: blank(formData.get("blockId")),
    reason: formData.get("reason"),
    details: blank(formData.get("details")),
    email: blank(formData.get("email")),
    website: formData.get("website") ?? undefined,
  });
  if (!parsed.success) return { status: formData.get("website") ? "done" : "invalid" };
  const { username, blockId, reason, details, email } = parsed.data;

  const ip = clientIp(await headers());
  if (!(await allow("report", ip, 5, 60 * 60)) || !(await allow("report-page", `${ip}:${username}`, 2, 24 * 60 * 60))) {
    return { status: "tooMany" };
  }

  try {
    // Only what a visitor can see can be reported: a published page, and a visible block of that page.
    const profile = await db.profile.findUnique({ where: { username }, select: { id: true, isPublished: true } });
    if (!profile?.isPublished) return { status: "error" };
    const block = blockId ? await db.block.findFirst({ where: { id: blockId, profileId: profile.id, isVisible: true }, select: { id: true } }) : null;
    await db.report.create({ data: { profileId: profile.id, blockId: block?.id ?? null, reason, details: details || null, email: email ?? null } });
    return { status: "done" };
  } catch (error) {
    console.error("submitReport failed", error);
    return { status: "error" };
  }
}
