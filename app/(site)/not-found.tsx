import { House } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { StatusPage } from "@/components/ui/status-page";
import { LostMascot } from "@/features/errors/components/lost-mascot";
import { localizedPath, pageLocale } from "@/i18n/marketing";
import { cn } from "@/lib/cn";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const home = localizedPath("/", pageLocale(await getLocale()));
  return (
    <StatusPage
      code="404"
      home={home}
      figure={<LostMascot />}
      title={t("notFoundTitle")}
      body={t("notFoundBody")}
      actions={
        <Link href={home} className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg)}>
          <House size={18} aria-hidden />
          {t("home")}
        </Link>
      }
    />
  );
}
