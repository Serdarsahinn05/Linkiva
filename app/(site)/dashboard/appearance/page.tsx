import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageReveal } from "@/features/dashboard/components/page";
import { AppearanceForm } from "@/features/appearance/components/appearance-form";
import { getEditorData } from "@/features/editor/queries";
import { features } from "@/lib/features";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("appearance"))("title") };
}

export default async function AppearancePage() {
  const session = await requireSession();
  const data = await getEditorData(session.user.id);
  if (!data) return null;
  return (
    <PageReveal>
      <AppearanceForm userId={session.user.id} uploadsEnabled={features.uploads} {...data} />
    </PageReveal>
  );
}
