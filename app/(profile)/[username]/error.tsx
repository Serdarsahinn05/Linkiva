"use client";

import { House, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button, buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { errorCopy } from "@/features/errors/fallback-copy";
import { LostMascot } from "@/features/errors/components/lost-mascot";
import { useVisitorLocale } from "@/i18n/use-visitor-locale";
import { cn } from "@/lib/cn";

// Public profile error boundary: the same page as the 404. The profile root has no client i18n provider, so the
// visitor's language is picked in the browser.
export default function ProfileError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = useVisitorLocale();
  const t = errorCopy[locale];
  const home = locale === "en" ? "/en" : "/";
  return (
    <StatusPage
      code={error.digest ? `#${error.digest}` : "500"}
      home={home}
      figure={<LostMascot />}
      title={t.errorTitle}
      body={t.errorBody}
      actions={
        <>
          <Button size="lg" onClick={retry}>
            <RotateCcw size={18} aria-hidden />
            {t.retry}
          </Button>
          <Link href={home} className={cn(buttonBase, buttonVariants.ghost, buttonSizes.lg)}>
            <House size={18} aria-hidden />
            {t.home}
          </Link>
        </>
      }
    />
  );
}
