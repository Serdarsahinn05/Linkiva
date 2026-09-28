import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/surface";
import { FeatureRows } from "@/features/landing/components/feature-rows";
import { LandingFaq } from "@/features/landing/components/landing-faq";
import { LandingStage } from "@/features/landing/components/landing-stage";
import { ThemeCaption, ThemePalette } from "@/features/landing/components/theme-palette";
import { landingSample } from "@/features/landing/sample";
import { stageLooks } from "@/features/landing/stage-looks";
import { SiteFooter } from "@/features/legal/components/site-footer";
import { LanguageSuggestion } from "@/features/locale/components/language-switch";
import { ClaimForm } from "@/features/profile/components/claim-form";
import { localizedPath, marketingAlternates, pageLocale } from "@/i18n/marketing";
import { cn } from "@/lib/cn";
import { THEME_KEYS, type ThemeKey } from "@/themes";

// The free-feature rows, split over the two feature stops (landing.free.*).
const FIRST = ["analytics", "themes", "grid", "domain", "payments", "portfolio", "import"] as const;
const SECOND = ["twofa", "schedule", "highlight", "capture", "embed", "qr", "redirect", "branding", "noSale"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: marketingAlternates("/", pageLocale(await getLocale())) };
}

/**
 * The landing (Faz 17, DESIGN.md §7 Landing): one sample phone travels down the page with the scroll.
 * Sections marked `data-stop` are its stops: hero, theme tour (held for several screens), features,
 * more features, questions, sign-up. Typing a username renames the phone; the palette beside it dresses
 * it in a theme and docks in the theme tour. Everything readable is plain HTML; the phone is decoration.
 */
// Also served at /en (app/(site)/en); the language comes from the address (i18n/marketing.ts).
export default async function HomePage() {
  const t = await getTranslations();
  const tl = await getTranslations("landing");
  const tb = await getTranslations("blocks");
  const ta = await getTranslations("appearance");
  const names = Object.fromEntries(THEME_KEYS.map((key) => [key, ta(`themes.${key}`)])) as Record<ThemeKey, string>; // one entry per key
  const descriptions = Object.fromEntries(THEME_KEYS.map((key) => [key, tl(`themeDesc.${key}`)])) as Record<ThemeKey, string>;
  const title = "text-[2.25rem] leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem]";

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <LandingStage
        sample={await landingSample()}
        looks={stageLooks()}
        labels={{
          badge: tl("sample"),
          views: tl("stageViews"),
          qr: tl("stageQr"),
          subscribePlaceholder: tb("subscribePlaceholder"),
          subscribe: tb("subscribeButton"),
        }}
        locale={await getLocale()}
      />
      <LanguageSuggestion page="/" />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between py-2">
        <Link href={localizedPath("/", pageLocale(await getLocale()))} className="inline-block rounded-full">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/login" className={cn(buttonBase, buttonVariants.ghost, buttonSizes.md)}>
            {t("common.login")}
          </Link>
          <Link href="/register" className={cn(buttonBase, buttonVariants.primary, buttonSizes.md)}>
            {t("common.startFree")}
          </Link>
        </nav>
      </header>

      <main id="main" className="mx-auto flex w-full max-w-6xl flex-col">
        <section data-stop className="grid min-h-dvh grid-cols-[minmax(0,1fr)] content-center items-center gap-10 py-12 lg:grid-cols-2 lg:py-0">
          <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
            <h1 className="text-[length:var(--text-display)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{tl("headline")}</h1>
            <p className="max-w-[46ch] text-lg text-ink-2 text-pretty">{tl("lede")}</p>
            <ClaimForm id="claim" label={tl("usernameLabel")} placeholder={tl("usernamePlaceholder")} cta={tl("claim")} />
            <p className="text-sm text-ink-3">{tl("promise")}</p>
            {/* Fixed on screen; here in the document so it comes right after the claim bar in tab order. */}
            <ThemePalette label={tl("themeLabel")} names={names} />
          </div>
          {/* Narrow screens: the room the phone takes under the hero (LandingStage). */}
          <div data-stage-slot className="mx-auto aspect-[620/760] w-full max-w-88 lg:hidden" />
        </section>

        {/* Held for several screens: the phone stays put and turns to the next theme per stretch. */}
        <section data-stop className="h-[560vh]">
          <div className="sticky top-0 grid min-h-dvh grid-cols-[minmax(0,1fr)] content-center items-center gap-6 py-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5 lg:gap-6">
              <h2 className={title}>{tl("themesTitle")}</h2>
              <p className="max-w-[40ch] text-lg text-ink-2">{tl("themesLede")}</p>
              <ThemeCaption names={names} descriptions={descriptions} />
              {/* The palette docks here (ThemePalette); this keeps its room. */}
              <div data-palette-slot className="h-[86px] w-72" />
            </div>
            <div data-stage-slot className="mx-auto aspect-[620/760] w-full max-w-60 lg:hidden" />
          </div>
        </section>

        <section data-stop className="grid min-h-dvh grid-cols-[minmax(0,1fr)] items-center py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-5 lg:col-start-2">
            <h2 className={title}>{tl("freeTitle")}</h2>
            <p className="text-lg text-ink-2">{tl("freeLede")}</p>
            <FeatureRows keys={FIRST} />
          </div>
        </section>

        <section data-stop className="grid min-h-dvh grid-cols-[minmax(0,1fr)] items-center py-16 lg:grid-cols-2">
          <FeatureRows keys={SECOND} />
        </section>

        <section data-stop className="grid min-h-dvh grid-cols-[minmax(0,1fr)] items-center py-16 lg:grid-cols-2">
          <div className="flex max-w-xl flex-col gap-6">
            <h2 className={title}>{tl("faqTitle")}</h2>
            <LandingFaq />
          </div>
        </section>

        <section data-stop className="flex min-h-dvh flex-col items-center justify-end gap-6 pb-[18vh] text-center">
          <h2 className="text-[2.25rem] leading-tight font-semibold tracking-[-0.03em]">{tl("closeTitle")}</h2>
          <p className="text-lg text-ink-2">{tl("closeLede")}</p>
          <ClaimForm id="claim-bottom" label={tl("usernameLabel")} placeholder={tl("usernamePlaceholder")} cta={tl("claim")} />
        </section>
      </main>

      <SiteFooter page="/" />
    </div>
  );
}
