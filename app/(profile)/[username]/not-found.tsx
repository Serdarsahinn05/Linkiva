import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { defaultLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";

// A free username is an invitation, not an error.
export default async function ProfileNotFound() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "profile" });
  return (
    <StatusPage
      code="404"
      title={t("notFoundTitle")}
      body=""
      actions={
        <>
          <Link href="/register" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
            {t("claim")}
          </Link>
          <Link href="/" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t("home")}
          </Link>
        </>
      }
    />
  );
}
