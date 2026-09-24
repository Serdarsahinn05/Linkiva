import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

// Phase 0 placeholder: proves tokens, font and i18n. The real landing ships in Phase 5.
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="pegboard min-h-dvh px-4 py-12 sm:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <span className="tape tape-type text-sm" lang="en" translate="no">
            {t("common.appName")}
          </span>
          <Link href="/register" className="tape tape-type text-sm" data-tone="red">
            {t("common.startFree")}
          </Link>
        </header>
        <h1 className="max-w-3xl text-[length:var(--text-display)] leading-[0.95] font-extrabold tracking-[-0.02em] [font-variation-settings:'wdth'_88] text-balance">
          {t("landing.headline")}
        </h1>
        <p className="max-w-[60ch] text-lg text-ink-2">{t("landing.lede")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="tape tape-type min-h-14 text-2xl [--tilt:-0.5deg]" data-tone="red" lang="en" translate="no">
            {site.host}/{t("landing.usernamePlaceholder")}
          </span>
        </div>
        <div className="flex flex-wrap gap-3" lang="en" aria-hidden>
          <span className="tape tape-type text-xs">Link</span>
          <span className="tape tape-type text-xs" data-tone="red">Header</span>
          <span className="tape tape-type text-xs" data-tone="blue">Text</span>
          <span className="tape tape-type text-xs" data-tone="yellow">Embed</span>
          <span className="tape tape-type text-xs" data-tone="green">E-mail</span>
          <span className="tape tape-type text-xs" data-tone="grey">Divider</span>
        </div>
      </div>
    </main>
  );
}
