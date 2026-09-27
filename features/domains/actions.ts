"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import { features } from "@/lib/features";
import { allow } from "@/lib/ratelimit";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { parseHostname } from "@/lib/validation/hostname";
import { addDomain, DomainUnavailableError, domainStatus, removeDomain } from "@/lib/vercel-domains";
import { profileTag } from "@/features/profile/public";
import { toDomainView, type DomainView } from "./view";

type DomainError = "unauthorized" | "invalid" | "exists" | "unavailable" | "tooMany" | "notFound" | "unknown";
export type DomainResult<T> = { ok: true; data: T } | { ok: false; error: DomainError };

const fail = (error: DomainError): DomainResult<never> => ({ ok: false, error });

/** The caller's own profile (ownership comes from the session, never from input), or a typed failure. */
async function ownProfile() {
  const user = await requireUser();
  const profile = await db.profile.findUnique({ where: { userId: user.id }, select: { id: true, username: true, customDomain: true } });
  return profile ? { user, profile } : null;
}

async function guarded<T>(body: () => Promise<DomainResult<T>>): Promise<DomainResult<T>> {
  if (!features.domains) return fail("notFound");
  try {
    return await body();
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail("unauthorized");
    console.error("custom domain action failed", error);
    return fail("unknown");
  }
}

/**
 * Settings → Domain: attaches the owner's domain to the Vercel project and records it (unverified).
 * A name another profile holds and a name Vercel refuses get the same answer, so nothing tells whose it is.
 */
export async function addCustomDomain(input: string): Promise<DomainResult<DomainView>> {
  const hostname = typeof input === "string" ? parseHostname(input) : null;
  if (!hostname) return fail("invalid");
  return guarded(async () => {
    const own = await ownProfile();
    if (!own) return fail("notFound");
    if (own.profile.customDomain) return fail("exists");
    if (!(await allow("domain-add", own.user.id, 5, 600))) return fail("tooMany");
    if (await db.customDomain.findUnique({ where: { hostname }, select: { id: true } })) return fail("unavailable");

    try {
      await addDomain(hostname);
    } catch (error) {
      if (error instanceof DomainUnavailableError) return fail("unavailable");
      throw error;
    }
    try {
      const row = await db.customDomain.create({ data: { profileId: own.profile.id, hostname } });
      return { ok: true, data: toDomainView(row, null) };
    } catch (error) {
      // Lost a race for the name, or for this profile's single slot: undo the Vercel side.
      await removeDomain(hostname).catch((e) => console.error("custom domain rollback failed", e));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("unavailable");
      throw error;
    }
  });
}

/** "Verify": asks Vercel whether the name is ours and its DNS points at us; the domain serves the profile only then. */
export async function checkCustomDomain(): Promise<DomainResult<DomainView>> {
  return guarded(async () => {
    const own = await ownProfile();
    const domain = own?.profile.customDomain;
    if (!own || !domain) return fail("notFound");
    if (!(await allow("domain-check", own.user.id, 20, 600))) return fail("tooMany");

    const status = await domainStatus(domain.hostname);
    const live = status.verified && !status.misconfigured;
    const row = await db.customDomain.update({ where: { id: domain.id }, data: { verifiedAt: live ? (domain.verifiedAt ?? new Date()) : null } });
    // The canonical address of the profile follows the domain (lib/site.ts → profileUrl).
    updateTag(profileTag(own.profile.username));
    return { ok: true, data: toDomainView(row, status) };
  });
}

/** Detaches the domain from Vercel, then forgets it. If Vercel cannot be reached, nothing changes and the owner can retry. */
export async function removeCustomDomain(): Promise<DomainResult<null>> {
  return guarded(async () => {
    const own = await ownProfile();
    const domain = own?.profile.customDomain;
    if (!own || !domain) return fail("notFound");
    await removeDomain(domain.hostname);
    await db.customDomain.deleteMany({ where: { id: domain.id, profileId: own.profile.id } });
    updateTag(profileTag(own.profile.username));
    return { ok: true, data: null };
  });
}
