import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/ui/surface";
import { ReportForm } from "@/features/moderation/components/report-form";
import { getPublicProfile } from "@/features/profile/public";
import { profileDisplayUrl, profileUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("report"))("title"), robots: { index: false, follow: false } };
}

// Linked from the foot of every public page (and from a block's gate). Only a published page can be reported.
export default async function ReportPage({ params, searchParams }: PageProps<"/report/[username]">) {
  const username = decodeURIComponent((await params).username).toLowerCase();
  const profile = await getPublicProfile(username);
  if (!profile?.isPublished) notFound();
  const { b } = await searchParams;
  const block = typeof b === "string" ? profile.blocks.find((x) => x.id === b) : undefined;
  const t = await getTranslations("report");
  const pageUrl = profileUrl(profile.username, profile.customDomain);

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10 sm:px-8">
      <header className="mx-auto w-full max-w-xl py-2">
        <Link href="/" className="inline-block rounded-full">
          <Wordmark />
        </Link>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-xl flex-col gap-6 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.03em]">{t("title")}</h1>
          <p className="text-ink-2">
            {t("intro", { address: profileDisplayUrl(profile.username, profile.customDomain) })} {block && t("aboutBlock")}
          </p>
        </div>
        <div className="glass rounded-[var(--radius-card)] p-5 sm:p-6">
          <ReportForm username={profile.username} blockId={block?.id} pageUrl={pageUrl} />
        </div>
        <p className="text-sm text-ink-3">
          {t("privacyNote")}{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            {t("privacyLink")}
          </Link>
        </p>
      </main>
    </div>
  );
}
