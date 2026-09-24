import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { profileLabels } from "@/components/blocks/labels";
import { ProfileView, type ProfileViewData } from "@/components/blocks/profile-view";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

const FREE_KEYS = ["analytics", "themes", "schedule", "highlight", "capture", "embed", "branding", "qr"] as const;

/** "linkiva.space/ [username] →": a plain GET form, works without JavaScript. */
function ClaimForm({ id, label, placeholder, cta }: { id: string; label: string; placeholder: string; cta: string }) {
  return (
    <form action="/register" method="get" className="glass-float liquid flex w-full max-w-xl items-center gap-1 rounded-full p-1.5 pl-5">
      <label htmlFor={id} lang="en" translate="no" className="shrink-0 text-[0.9375rem] text-ink-3 sm:text-base">
        {site.host}/
      </label>
      <input
        id={id}
        name="username"
        aria-label={label}
        placeholder={placeholder}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        maxLength={30}
        className="h-12 min-w-0 flex-1 bg-transparent text-[0.9375rem] font-medium text-ink placeholder:text-ink-3 focus-visible:outline-none sm:text-base"
      />
      <button type="submit" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "shrink-0 px-5")}>
        <span className="max-sm:sr-only">{cta}</span>
        <ArrowRight size={18} aria-hidden />
      </button>
    </form>
  );
}

export default async function HomePage() {
  const t = await getTranslations();
  const tl = await getTranslations("landing");
  const links = tl.raw("sampleLinks") as string[];

  // Synthetic sample profile, clearly labelled as such (not a real user).
  const sample: ProfileViewData = {
    username: "deniz",
    displayName: tl("sampleName"),
    bio: tl("sampleBio"),
    avatarUrl: null,
    showBranding: false,
    theme: "cam",
    appearance: {},
    socials: [
      { platform: "INSTAGRAM", handle: "deniz" },
      { platform: "BEHANCE", handle: "deniz" },
      { platform: "EMAIL", handle: "deniz@example.com" },
    ],
    blocks: [
      { id: "s1", type: "HEADER", data: { text: tl("sampleHeader") }, isHighlighted: false },
      { id: "s2", type: "LINK", data: { title: links[0], url: "https://example.com" }, isHighlighted: true },
      { id: "s3", type: "LINK", data: { title: links[1], url: "https://example.com" }, isHighlighted: false },
      { id: "s4", type: "LINK", data: { title: links[2], url: "https://example.com" }, isHighlighted: false },
      { id: "s5", type: "EMAIL_CAPTURE", data: { title: tl("sampleCapture") }, isHighlighted: false },
    ],
  };

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

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-28 pb-16">
        {/* First viewport: the promise, the claim bar, and the product at work. */}
        <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 pt-12 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-0">
          <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
            <h1 className="text-[length:var(--text-display)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">{tl("headline")}</h1>
            <p className="max-w-[46ch] text-lg text-ink-2 text-pretty">{tl("lede")}</p>
            <ClaimForm id="claim" label={tl("usernameLabel")} placeholder={tl("usernamePlaceholder")} cta={tl("claim")} />
          </div>

          <figure className="relative mx-auto w-full max-w-[340px]">
            <figcaption className="glass absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-xs text-ink-2">{tl("sample")}</figcaption>
            <div className="glass rounded-[44px] p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.45)]">
              <div className="pointer-events-none h-[620px] overflow-hidden rounded-[36px]" aria-hidden>
                <ProfileView profile={sample} mode="preview" labels={profileLabels(t)} />
              </div>
            </div>
          </figure>
        </section>

        {/* Free features: one glass panel of rows, not a card grid. */}
        <section aria-labelledby="free" className="flex flex-col items-center gap-8">
          <div className="flex max-w-2xl flex-col gap-3 text-center">
            <h2 id="free" className="text-[2.25rem] leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
              {tl("freeTitle")}
            </h2>
            <p className="text-lg text-ink-2">{tl("freeLede")}</p>
          </div>
          <ul className="glass w-full max-w-3xl divide-y divide-glass-edge rounded-[28px] px-2">
            {FREE_KEYS.map((key) => {
              const [title, body] = tl.raw(`free.${key}`) as [string, string];
              return (
                <li key={key} className="flex items-start gap-4 px-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-[0.9375rem] text-ink-2">{body}</p>
                  </div>
                  {/* Green means "included": the one colour on this page carries meaning. */}
                  <span className="neon mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-positive">
                    <Check size={15} strokeWidth={2.5} aria-hidden />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-[2.25rem] leading-tight font-semibold tracking-[-0.03em]">{tl("closeTitle")}</h2>
          <p className="text-lg text-ink-2">{tl("closeLede")}</p>
          <ClaimForm id="claim-bottom" label={tl("usernameLabel")} placeholder={tl("usernamePlaceholder")} cta={tl("claim")} />
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-glass-edge py-6 text-sm text-ink-3">
        <span lang="en" translate="no">
          © {new Date().getFullYear()} {site.name}
        </span>
        <Link href="/privacy" className="hover:text-ink">
          {tl("privacy")}
        </Link>
      </footer>
    </div>
  );
}
