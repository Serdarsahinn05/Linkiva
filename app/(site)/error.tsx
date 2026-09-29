"use client";

import { House, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { LostMascot } from "@/features/errors/components/lost-mascot";
import { localizedPath, pageLocale } from "@/i18n/marketing";
import { cn } from "@/lib/cn";

// Error boundary for everything under (site): the same open page as the 404, the mascot with its broken chain.
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");
  const home = localizedPath("/", pageLocale(useLocale()));
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      code={error.digest ? `#${error.digest}` : "500"}
      home={home}
      figure={<LostMascot />}
      title={t("errorTitle")}
      body={t("errorBody")}
      actions={
        <>
          <Button size="lg" onClick={retry}>
            <RotateCcw size={18} aria-hidden />
            {t("retry")}
          </Button>
          <Link href={home} className={cn(buttonBase, buttonVariants.ghost, buttonSizes.lg)}>
            <House size={18} aria-hidden />
            {t("home")}
          </Link>
        </>
      }
    />
  );
}
