import { Mail } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitch } from "@/features/locale/components/language-switch";
import { localizedPath, pageLocale, type MarketingPage } from "@/i18n/marketing";
import { site } from "@/lib/site";

const item = "rounded-sm hover:text-ink focus-visible:text-ink";

/** Landing and legal pages: how to reach us, the two documents every visitor may need, and the other language. */
export async function SiteFooter({ page }: { page: MarketingPage }) {
  const t = await getTranslations("legal");
  const locale = pageLocale(await getLocale());
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-glass-edge py-6 text-sm text-ink-3">
      <span lang="en" translate="no">
        © {new Date().getFullYear()} {site.name}
      </span>
      <nav aria-label={t("footerNav")} className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <a href={`mailto:${site.email}`} className={`${item} inline-flex items-center gap-1.5`}>
          <Mail size={15} strokeWidth={1.75} aria-hidden />
          <span className="sr-only">{t("contact")}: </span>
          {site.email}
        </a>
        <Link href={localizedPath("/privacy", locale)} className={item}>
          {t("privacy")}
        </Link>
        <Link href={localizedPath("/terms", locale)} className={item}>
          {t("terms")}
        </Link>
        <LanguageSwitch page={page} />
      </nav>
    </footer>
  );
}
