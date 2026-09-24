import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotForm } from "@/features/auth/components/forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("auth.forgot"))("title") };
}

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
