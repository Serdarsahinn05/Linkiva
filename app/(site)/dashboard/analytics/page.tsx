import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/dashboard/components/page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("analytics") };
}

// Placeholder until its phase lands (docs/ROADMAP.md).
export default async function Page() {
  const t = await getTranslations();
  return <ComingSoon title={t("nav.analytics")} body={t("soon.analytics")} back={t("soon.back")} />;
}
