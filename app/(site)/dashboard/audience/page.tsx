import { Download } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriberList } from "@/features/audience/components/subscriber-list";
import { getSubscribers } from "@/features/audience/queries";
import { PageHeader, PageReveal, Section } from "@/features/dashboard/components/page";
import { cn } from "@/lib/cn";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("audience"))("title") };
}

type Rows = Awaited<ReturnType<typeof getSubscribers>>;

export default async function AudiencePage() {
  const session = await requireSession();
  const t = await getTranslations("audience");
  // Started here, awaited inside the streamed parts: the title renders without waiting for the list.
  const rows = getSubscribers(session.user.id);

  return (
    <PageReveal>
      <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
        <PageHeader title={t("title")}>
          <Suspense fallback={null}>
            <ExportLink rows={rows} label={t("export")} />
          </Suspense>
        </PageHeader>
        <Suspense fallback={<ListSkeleton loading={(await getTranslations("common"))("loading")} />}>
          <Subscribers rows={rows} />
        </Suspense>
      </div>
    </PageReveal>
  );
}

/** A file download, not a navigation, so a plain <a download> is the right element. Only once there are rows. */
async function ExportLink({ rows, label }: { rows: Promise<Rows>; label: string }) {
  if ((await rows).length === 0) return null;
  return (
    <a href="/dashboard/audience/export" download className={cn(buttonBase, buttonVariants.secondary, buttonSizes.md)}>
      <Download size={16} aria-hidden />
      {label}
    </a>
  );
}

async function Subscribers({ rows: pending }: { rows: Promise<Rows> }) {
  const t = await getTranslations("audience");
  const rows = await pending;
  return (
    <Section title={t("count", { count: rows.length })}>
      {rows.length === 0 ? (
        <p className="text-ink-2">{t("empty")}</p>
      ) : (
        <SubscriberList initial={rows.map((r) => ({ id: r.id, email: r.email, createdAt: r.createdAt.toISOString() }))} />
      )}
    </Section>
  );
}

function ListSkeleton({ loading }: { loading: string }) {
  return (
    <Section>
      <span role="status" className="sr-only">
        {loading}
      </span>
      <Skeleton className="h-4 w-28" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </Section>
  );
}
