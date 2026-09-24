"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import { sendMailQuietly } from "@/lib/mail/send";
import { profileUrl } from "@/lib/site";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { usernameProblem, usernameSchema, type UsernameProblem } from "@/lib/validation/username";

export type UsernameStatus =
  | { state: "available"; username: string }
  | { state: "taken"; username: string; suggestion?: string }
  | { state: "problem"; problem: UsernameProblem };

async function isTaken(username: string) {
  return (await db.profile.count({ where: { username } })) > 0;
}

/** First free, valid variant of a taken username, if any. */
async function suggestFor(username: string): Promise<string | undefined> {
  const base = username.slice(0, 26);
  const candidates = [`${base}.tr`, `${base}_`, ...Array.from({ length: 3 }, () => `${base}${Math.floor(10 + Math.random() * 90)}`)];
  for (const candidate of candidates) {
    if (!usernameProblem(candidate) && !(await isTaken(candidate))) return candidate;
  }
  return undefined;
}

export async function checkUsername(raw: string): Promise<UsernameStatus> {
  await requireUser();
  const username = raw.trim().toLowerCase();
  const problem = usernameProblem(username);
  if (problem) return { state: "problem", problem };
  if (await isTaken(username)) return { state: "taken", username, suggestion: await suggestFor(username) };
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
  try {
    await db.profile.create({ data: { userId, username, displayName: displayName || null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      if (target.includes("userId")) return { ok: false, error: "exists" };
      return { ok: false, error: "taken", suggestion: await suggestFor(username) };
    }
    console.error("createProfile failed", error);
    return { ok: false, error: "unknown" };
  }

  // Welcome mail for every new page (email and Google sign-ups alike).
  await sendMailQuietly({ to: email, kind: "welcome", locale: (await getLocale()) === "en" ? "en" : "tr", url: profileUrl(username) });
  redirect("/dashboard");
}
