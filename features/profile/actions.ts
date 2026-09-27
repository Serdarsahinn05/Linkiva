"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import { sendMailQuietly } from "@/lib/mail/send";
import { profileUrl } from "@/lib/site";
import { requireUser, UnauthorizedError } from "@/lib/session";
import {
  USERNAME_CHANGES_PER_30_DAYS,
  USERNAME_REDIRECT_DAYS,
  usernameProblem,
  usernameSchema,
  type UsernameProblem,
} from "@/lib/validation/username";
import { profileTag } from "./public";

export type UsernameStatus =
  | { state: "available"; username: string }
  | { state: "taken"; username: string; suggestion?: string }
  | { state: "problem"; problem: UsernameProblem };

const DAY = 24 * 60 * 60 * 1000;

/**
 * A name is taken by a live profile, or by someone's past name that still redirects (UsernameHistory).
 * The caller's own current and past names are not taken for the caller.
 */
async function isTaken(username: string, ownProfileId?: string) {
  const [profile, past] = await Promise.all([
    db.profile.findUnique({ where: { username }, select: { id: true } }),
    db.usernameHistory.findUnique({ where: { username }, select: { profileId: true, expiresAt: true } }),
  ]);
  if (profile) return profile.id !== ownProfileId;
  return Boolean(past && past.profileId !== ownProfileId && past.expiresAt > new Date());
}

/** First free, valid variant of a taken username, if any. */
async function suggestFor(username: string, ownProfileId?: string): Promise<string | undefined> {
  const base = username.slice(0, 26);
  const candidates = [`${base}.tr`, `${base}_`, ...Array.from({ length: 3 }, () => `${base}${Math.floor(10 + Math.random() * 90)}`)];
  for (const candidate of candidates) {
    if (!usernameProblem(candidate) && !(await isTaken(candidate, ownProfileId))) return candidate;
  }
  return undefined;
}

export async function checkUsername(raw: string): Promise<UsernameStatus> {
  const user = await requireUser();
  const username = raw.trim().toLowerCase();
  const problem = usernameProblem(username);
  if (problem) return { state: "problem", problem };
  const own = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (await isTaken(username, own?.id)) return { state: "taken", username, suggestion: await suggestFor(username, own?.id) };
  return { state: "available", username };
}

const createProfileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(60).optional(),
});

export type CreateProfileResult = { ok: false; error: "unauthorized" | "invalid" | "taken" | "exists" | "unknown"; suggestion?: string };

export async function createProfile(_prev: CreateProfileResult | null, formData: FormData): Promise<CreateProfileResult> {
  let userId: string;
  let email: string;
  try {
    const user = await requireUser();
    userId = user.id;
    email = user.email;
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    throw error;
  }

  const parsed = createProfileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { username, displayName } = parsed.data;
  if (await isTaken(username)) return { ok: false, error: "taken", suggestion: await suggestFor(username) };
  try {
    await db.$transaction([
      // An expired past name is free again; its history row goes before someone else goes live on it.
      db.usernameHistory.deleteMany({ where: { username, expiresAt: { lte: new Date() } } }),
      db.profile.create({ data: { userId, username, displayName: displayName || null } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      if (target.includes("userId")) return { ok: false, error: "exists" };
      return { ok: false, error: "taken", suggestion: await suggestFor(username) };
    }
    console.error("createProfile failed", error);
    return { ok: false, error: "unknown" };
  }

  // A visit before this name existed may have cached "no such profile".
  updateTag(profileTag(username));

  // Welcome mail for every new page (email and Google sign-ups alike).
  await sendMailQuietly({ to: email, kind: "welcome", locale: (await getLocale()) === "en" ? "en" : "tr", url: profileUrl(username) });
  redirect("/dashboard");
}

export type ChangeUsernameResult =
  | { ok: true; username: string }
  | { ok: false; error: "unauthorized" | "invalid" | "notFound" | "taken" | "limit" | "unknown"; suggestion?: string };

/**
 * Moves the profile to a new username. The old one goes to UsernameHistory: it 308-redirects to the new address and
 * nobody else can claim it for USERNAME_REDIRECT_DAYS. Going back to one's own past name is allowed.
 */
export async function changeUsername(raw: string): Promise<ChangeUsernameResult> {
  try {
    const user = await requireUser();
    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const username = parsed.data;

    const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true } });
    if (!profile) return { ok: false, error: "notFound" };
    if (profile.username === username) return { ok: true, username };

    const now = new Date();
    const recent = await db.usernameHistory.count({ where: { profileId: profile.id, createdAt: { gt: new Date(now.getTime() - 30 * DAY) } } });
    if (recent >= USERNAME_CHANGES_PER_30_DAYS) return { ok: false, error: "limit" };
    if (await isTaken(username, profile.id)) return { ok: false, error: "taken", suggestion: await suggestFor(username, profile.id) };

    const expiresAt = new Date(now.getTime() + USERNAME_REDIRECT_DAYS * DAY);
    await db.$transaction([
      // The new name leaves history if it was ours, or if someone's claim on it has expired.
      db.usernameHistory.deleteMany({ where: { username, OR: [{ profileId: profile.id }, { expiresAt: { lte: now } }] } }),
      db.usernameHistory.upsert({
        where: { username: profile.username },
        create: { username: profile.username, profileId: profile.id, createdAt: now, expiresAt },
        update: { profileId: profile.id, createdAt: now, expiresAt },
      }),
      db.profile.update({ where: { id: profile.id }, data: { username } }),
    ]);

    updateTag(profileTag(profile.username));
    updateTag(profileTag(username));
    refresh();
    return { ok: true, username };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: "unauthorized" };
    // Someone went live on the name between the check and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "taken" };
    console.error("changeUsername failed", error);
    return { ok: false, error: "unknown" };
  }
}
