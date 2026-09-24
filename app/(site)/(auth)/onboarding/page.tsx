import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "@/features/profile/components/onboarding-form";
import { getOwnProfile } from "@/features/profile/queries";
import { requireSession } from "@/lib/session";
import { site } from "@/lib/site";
import { toUsernameCandidate } from "@/lib/validation/username";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("onboarding"))("title") };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const session = await requireSession();
  if (await getOwnProfile(session.user.id)) redirect("/dashboard");

  // Prefill: the name claimed on the landing page, else one derived from the account name.
  const { username } = await searchParams;
  const initial = toUsernameCandidate(typeof username === "string" ? username : session.user.name);

  return <OnboardingForm initialUsername={initial} host={site.host} />;
}
