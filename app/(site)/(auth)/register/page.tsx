import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";
import { features } from "@/lib/features";
import { getSession } from "@/lib/session";
import { toUsernameCandidate } from "@/lib/validation/username";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.register"))("submit") };
}

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  if (await getSession()) redirect("/dashboard");
  const { username } = await searchParams;
  const claimed = typeof username === "string" ? toUsernameCandidate(username) : undefined;
  return <RegisterForm googleEnabled={features.google} claimedUsername={claimed || undefined} />;
}
