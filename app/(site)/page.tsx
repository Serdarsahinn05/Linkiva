import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

// First viewport of the landing page (DESIGN.md §7). The full page (sample profile, "free" section) lands in Phase 5.
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <Wordmark />
        <nav className="flex items-center gap-1">
          <Link href="/login" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t("common.login")}
          </Link>
          <Link href="/register" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
            {t("common.startFree")}
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 pb-24 text-center">
        <h1 className="text-[length:var(--text-display)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{t("landing.headline")}</h1>
        <p className="max-w-[52ch] text-lg text-ink-2 text-pretty">{t("landing.lede")}</p>

        {/* Claim bar: a plain GET form, works without JavaScript. */}
        <form action="/register" method="get" className="glass-float liquid flex w-full max-w-xl items-center gap-1 rounded-full p-1.5 pl-5">
          <label htmlFor="claim" lang="en" translate="no" className="shrink-0 text-[0.9375rem] text-ink-3 sm:text-base">
            {site.host}/
          </label>
          <input
            id="claim"
            name="username"
            aria-label={t("landing.usernameLabel")}
            placeholder={t("landing.usernamePlaceholder")}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
            className="h-12 min-w-0 flex-1 bg-transparent text-[0.9375rem] font-medium text-ink placeholder:text-ink-3 focus-visible:outline-none sm:text-base"
          />
          <button type="submit" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "shrink-0 px-5")}>
            <span className="max-sm:sr-only">{t("landing.claim")}</span>
            <ArrowRight size={18} aria-hidden />
          </button>
        </form>
      </main>
    </div>
  );
}
