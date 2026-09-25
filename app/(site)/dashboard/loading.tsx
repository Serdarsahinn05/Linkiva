import { getTranslations } from "next-intl/server";
import { Bone, FieldBone, PhoneBone, SectionBone, Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page";

export default async function EditorLoading() {
  const t = await getTranslations();
  return (
    <Skeleton label={t("common.loading")} className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-10">
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader title={t("editor.title")} />
        <SectionBone>
          <div className="flex items-center gap-4">
            <Bone className="size-16" />
            <Bone className="h-11 w-36" />
          </div>
          <FieldBone />
          <FieldBone tall />
        </SectionBone>
        <div aria-hidden className="glass flex h-14 items-center justify-between rounded-[var(--radius-card)] px-5">
          <Bone className="h-3.5 w-32" />
          <Bone className="size-4" />
        </div>
        <div className="flex flex-col gap-3">
          <Bone className="h-3.5 ml-1 w-24" />
          <div className="flex gap-2 overflow-hidden">
            {["w-24", "w-28", "w-24", "w-20", "w-28"].map((w, i) => (
              <Bone key={i} className={`h-11 shrink-0 ${w}`} />
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-flat flex flex-col gap-3 rounded-[var(--radius-card)] py-4 pr-4 pl-14">
                <Bone className="h-3.5 w-20" />
                <Bone className="h-12 w-full" shape="control" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <PhoneBone />
    </Skeleton>
  );
}
