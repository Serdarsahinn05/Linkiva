"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import type { Locale } from "@/i18n/config";
import { useVisitorLocale } from "@/i18n/use-visitor-locale";
import { cn } from "@/lib/cn";
import { toUsernameCandidate, usernameProblem } from "@/lib/validation/username";
import { ClaimForm } from "./claim-form";

export type ProfileNotFoundCopy = { title: string; claimable: string; claim: string; home: string; label: string; placeholder: string };

/**
 * An address with no page is an invitation: the name typed in the URL is ready in the claim bar. Whether it is really
 * free is checked at sign-up (it may be taken but unpublished, or held for a renamed profile), hence "could be".
 * Client-side so the cached profile route stays static: the address and language are read in the browser.
 */
export function ProfileNotFound({ copy }: { copy: Record<Locale, ProfileNotFoundCopy> }) {
  const t = copy[useVisitorLocale()];
  const segment = usePathname().split("/")[1] ?? "";
  let candidate = "";
  try {
    candidate = toUsernameCandidate(decodeURIComponent(segment).toLowerCase());
  } catch {
    // Malformed percent-encoding: no suggestion.
  }
  const claimable = usernameProblem(candidate) === null ? candidate : "";

  return (
    <StatusPage
      code="404"
      title={t.title}
      body={claimable ? t.claimable.replace("{username}", claimable) : ""}
      actions={
        <>
          <ClaimForm id="claim-404" label={t.label} placeholder={t.placeholder} cta={t.claim} defaultValue={claimable} compact />
          <Link href="/" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t.home}
          </Link>
        </>
      }
    />
  );
}
