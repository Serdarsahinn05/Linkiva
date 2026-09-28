import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { privacy } from "@/features/legal/privacy";
import { marketingAlternates, pageLocale } from "@/i18n/marketing";

// Also served at /en/privacy (app/(site)/en/privacy); the language comes from the address (i18n/marketing.ts).
export async function generateMetadata(): Promise<Metadata> {
  const locale = pageLocale(await getLocale());
  return { title: privacy[locale].title, alternates: marketingAlternates("/privacy", locale) };
}

export default async function PrivacyPage() {
  return <LegalDocument doc={privacy[pageLocale(await getLocale())]} page="/privacy" />;
}
