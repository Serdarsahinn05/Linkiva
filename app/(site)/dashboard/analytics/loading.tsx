import { getTranslations } from "next-intl/server";
import { Bone, SectionBone, Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page";
import { cn } from "@/lib/cn";

export default async function AnalyticsLoading() {
  const t = await getTranslations();
  return (
    <Skeleton label={t("common.loading")} className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
      <PageHeader title={t("analytics.title")} />
      <Bone className="h-12 w-72 max-w-full" />
      {/* Same geometry as the stat strip, so the numbers land exactly where their bones were. */}
      <div aria-hidden className="glass grid grid-cols-2 overflow-hidden rounded-[var(--radius-card)] lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn("flex flex-col gap-2.5 p-5", i % 2 === 1 && "border-l border-glass-edge", i >= 2 && "max-lg:border-t max-lg:border-glass-edge", i === 2 && "lg:border-l lg:border-glass-edge")}>
            <Bone className="h-3.5 w-20" />
            <Bone className="h-7 w-16" shape="control" />
            <Bone className="h-5 w-14" />
          </div>
        ))}
      </div>
      <SectionBone>
        <Bone className="h-64 w-full" shape="control" />
      </SectionBone>
      <SectionBone>
        <RowBones />
      </SectionBone>
    </Skeleton>
  );
}

function RowBones() {
  return (
    <div className="flex flex-col gap-4">
      {["w-40", "w-32", "w-44", "w-28"].map((w) => (
        <div key={w} className="flex flex-col gap-2">
          <div className="flex justify-between gap-4">
            <Bone className={`h-3.5 ${w}`} />
            <Bone className="h-3.5 w-16" />
          </div>
          <Bone className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}
