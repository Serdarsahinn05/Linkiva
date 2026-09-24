import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { defaultLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";

// A free username is an invitation, not an error.
export default async function ProfileNotFound() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "profile" });
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass flex max-w-md flex-col items-center gap-5 rounded-[28px] px-8 py-12 text-center">
        <span className="font-mono text-sm text-ink-3">404</span>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{t("notFoundTitle")}</h1>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/register" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
            {t("claim")}
          </Link>
          <Link href="/" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
