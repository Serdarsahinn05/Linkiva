"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { cn } from "@/lib/cn";

// Error boundary for everything under (site): keeps the shell's look instead of Next's default screen.
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      code={error.digest ? `#${error.digest}` : "500"}
      title={t("errorTitle")}
      body={t("errorBody")}
      actions={
        <>
          <Button size="md" onClick={reset}>
            {t("retry")}
          </Button>
          <Link href="/" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t("home")}
          </Link>
        </>
      }
    />
  );
}
