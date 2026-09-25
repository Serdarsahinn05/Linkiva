import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageReveal } from "@/features/dashboard/components/page";
import { Editor } from "@/features/editor/components/editor";
import { getEditorData } from "@/features/editor/queries";
import { features } from "@/lib/features";
import { requireSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("links") };
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getEditorData(session.user.id);
  // The layout already redirects users without a profile to onboarding.
  if (!data) return null;
  return (
    <PageReveal>
      <Editor {...data} userId={session.user.id} uploadsEnabled={features.uploads} />
    </PageReveal>
  );
}
