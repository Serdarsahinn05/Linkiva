import { Download } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { SubscriberList } from "@/features/audience/components/subscriber-list";
import { getSubscribers } from "@/features/audience/queries";
import { PageHeader, PageReveal, Section } from "@/features/dashboard/components/page";
import { cn } from "@/lib/cn";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("audience"))("title") };
}

export default async function AudiencePage() {
  const session = await requireSession();
  const t = await getTranslations("audience");
  const rows = await getSubscribers(session.user.id);

  return (
    <PageReveal>
      <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
        <PageHeader title={t("title")}>
          {rows.length > 0 && (
            // A file download, not a navigation, so a plain <a download> is the right element.
            <a href="/dashboard/audience/export" download className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
              <Download size={16} aria-hidden />
              {t("export")}
            </a>
          )}
        </PageHeader>
        <Section title={t("count", { count: rows.length })}>
          {rows.length === 0 ? (
            <p className="text-ink-2">{t("empty")}</p>
          ) : (
            <SubscriberList initial={rows.map((r) => ({ id: r.id, email: r.email, createdAt: r.createdAt.toISOString() }))} />
          )}
        </Section>
      </div>
    </PageReveal>
  );
}
