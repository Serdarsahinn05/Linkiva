import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { cn } from "@/lib/cn";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <StatusPage
      code="404"
      title={t("notFoundTitle")}
      body={t("notFoundBody")}
      actions={
        <Link href="/" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
          {t("home")}
        </Link>
      }
    />
  );
}
