import { getTranslations } from "next-intl/server";
import { Bone, SectionBone, Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page";

export default async function AudienceLoading() {
  const t = await getTranslations();
  return (
    <Skeleton label={t("common.loading")} className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
      <PageHeader title={t("audience.title")} />
      <SectionBone>
        {["w-48", "w-40", "w-52", "w-36"].map((w) => (
          <div key={w} className="flex items-center justify-between gap-4 py-1">
            <Bone className={`h-3.5 ${w}`} />
            <Bone className="h-3.5 w-16" />
          </div>
        ))}
      </SectionBone>
    </Skeleton>
  );
}
