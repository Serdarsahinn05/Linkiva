import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { features } from "@/lib/features";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.login"))("submit") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/dashboard");
  const { reset } = await searchParams;
  return <LoginForm googleEnabled={features.google} notice={reset ? "passwordReset" : undefined} />;
}
