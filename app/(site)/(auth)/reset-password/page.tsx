import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetForm } from "@/features/auth/components/reset-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.reset"))("title") };
}

// Better Auth redirects here with ?token=… on a valid link, or ?error=INVALID_TOKEN.
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  return <ResetForm token={!error && typeof token === "string" ? token : null} />;
}
