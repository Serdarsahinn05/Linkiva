import { getTranslations } from "next-intl/server";
import { Bone, FieldBone, SectionBone, Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/dashboard/components/page";

export default async function SettingsLoading() {
  const t = await getTranslations();
  return (
    <Skeleton label={t("common.loading")} className="mx-auto flex max-w-[680px] flex-col gap-6 px-4 py-4 sm:px-8 lg:py-10">
      <PageHeader title={t("settings.title")} />
      <SectionBone>
        <div className="flex items-center justify-between gap-4">
          <Bone className="h-3.5 w-40" />
          <Bone className="h-7 w-12" />
        </div>
        <FieldBone />
        <FieldBone tall />
      </SectionBone>
      <SectionBone>
        <Bone className="h-11 w-full" />
        <Bone className="h-11 w-full" />
      </SectionBone>
      <SectionBone>
        <FieldBone />
        <Bone className="h-11 w-32" />
      </SectionBone>
    </Skeleton>
  );
}
