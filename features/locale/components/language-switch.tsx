import { Languages } from "lucide-react";
import { cookies, headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonVariants } from "@/components/ui/button";
import { isLocale, LOCALE_COOKIE, matchAcceptLanguage, type Locale } from "@/i18n/config";
import type { MarketingPage } from "@/i18n/marketing";
import { cn } from "@/lib/cn";
import { switchLanguage } from "../actions";
import { SwitchButton } from "./switch-button";

const other = (locale: string): Locale => (locale === "en" ? "tr" : "en");

function SwitchForm({ page, to, children }: { page: MarketingPage; to: Locale; children: React.ReactNode }) {
  return (
    <form action={switchLanguage} className="contents">
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="page" value={page} />
      {children}
    </form>
  );
}

/** Footer link to the same page in the other language (the page's own language is fixed by its address). */
export async function LanguageSwitch({ page }: { page: MarketingPage }) {
  const to = other(await getLocale());
  const t = await getTranslations("languageSwitch");
  return (
    <SwitchForm page={page} to={to}>
      <SwitchButton title={t("title")} className="inline-flex items-center gap-1.5 rounded-sm hover:text-ink focus-visible:text-ink">
        <Languages size={15} strokeWidth={1.75} aria-hidden />
        <span lang={to}>{t("name")}</span>
      </SwitchButton>
    </SwitchForm>
  );
}

/**
 * Shown above a site page only when the visitor's own language (chosen before, else the browser's) is the other one:
 * an English browser opening linkiva.space sees the offer in English. No automatic redirect.
 */
export async function LanguageSuggestion({ page }: { page: MarketingPage }) {
  const to = other(await getLocale());
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(cookie) ? cookie : matchAcceptLanguage((await headers()).get("accept-language"));
  if (preferred !== to) return null;
  const t = await getTranslations({ locale: to, namespace: "languageSwitch" });
  return (
    <div lang={to} className="mx-auto flex w-full max-w-6xl justify-center pt-2">
      <div className="glass flex max-w-full items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4 text-sm text-ink-2">
        <span className="min-w-0">{t("suggest")}</span>
        <SwitchForm page={page} to={to}>
          <SwitchButton className={cn(buttonBase, buttonVariants.secondary, "h-9 shrink-0 px-4 text-sm")}>{t("switch")}</SwitchButton>
        </SwitchForm>
      </div>
    </div>
  );
}
