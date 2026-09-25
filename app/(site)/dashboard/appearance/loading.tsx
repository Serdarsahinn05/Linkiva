import { getTranslations } from "next-intl/server";
import { Bone, PhoneBone, SectionBone, Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page";

export default async function AppearanceLoading() {
  const t = await getTranslations();
  return (
    <Skeleton label={t("common.loading")} className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-10">
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader title={t("appearance.title")} />
        <SectionBone>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-2 p-1.5">
                <Bone className="h-32 w-full" shape="control" />
                <Bone className="h-3.5 mx-1.5 w-16" />
                <Bone className="mx-1.5 mb-1 h-3 w-24" />
              </div>
            ))}
          </div>
        </SectionBone>
        <SectionBone>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-11 w-full" />
            </div>
          ))}
        </SectionBone>
      </div>
      <PhoneBone />
    </Skeleton>
  );
}
