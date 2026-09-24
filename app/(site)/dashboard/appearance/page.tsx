import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ComingSoon } from "@/features/dashboard/components/page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("appearance") };
}

// Placeholder until its phase lands (docs/ROADMAP.md).
export default async function Page() {
  const t = await getTranslations();
  return <ComingSoon title={t("nav.appearance")} body={t("soon.appearance")} back={t("soon.back")} />;
}
