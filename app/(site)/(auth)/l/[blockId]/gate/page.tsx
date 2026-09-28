import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { getLiveBlock } from "@/features/profile/public";
import { cn } from "@/lib/cn";
import { profileUrl } from "@/lib/site";
import { displayHost } from "@/lib/validation/url";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("gate"))("metaTitle"), robots: { index: false, follow: false } };
}

/**
 * The warning before a link its owner marked sensitive (/l/<id> sends gated links here). Server-rendered and plain
 * links only, so it works without JS. Nothing is recorded here; "Continue" goes back through /l/<id>?ok=1, which counts
 * the tap and forwards.
 */
export default async function GatePage({ params }: PageProps<"/l/[blockId]/gate">) {
  const { blockId } = await params;
  const live = await getLiveBlock(blockId);
  if (!live || live.block.type !== "LINK" || !live.block.data.gate) notFound();
  const t = await getTranslations("gate");
  const kind = live.block.data.gate;
  const owner = live.profile.displayName || live.profile.username;

  return (
    <div className="flex flex-col gap-5">
      <TriangleAlert size={28} strokeWidth={1.75} className="text-warning" aria-hidden />
      <div className="flex flex-col gap-2">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance">{t(`${kind}.title`)}</h1>
        <p className="text-ink-2">{t(`${kind}.body`, { owner })}</p>
      </div>
      <p className="glass-flat flex flex-col gap-0.5 rounded-[var(--radius-control)] px-4 py-3 text-sm">
        <span className="text-ink-3">{t("destination")}</span>
        <span className="font-medium break-all">{displayHost(live.block.data.url)}</span>
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <a href={`/l/${blockId}?ok=1`} rel="noopener nofollow" className={cn(buttonBase, buttonVariants.primary, buttonSizes.lg, "sm:flex-1")}>
          {t("continue")}
        </a>
        <a href={profileUrl(live.profile.username, live.profile.domain)} className={cn(buttonBase, buttonVariants.secondary, buttonSizes.lg, "sm:flex-1")}>
          {t("back")}
        </a>
      </div>
    </div>
  );
}
