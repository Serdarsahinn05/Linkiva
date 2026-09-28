import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { terms } from "@/features/legal/terms";
import { marketingAlternates, pageLocale } from "@/i18n/marketing";

// Also served at /en/terms (app/(site)/en/terms); the language comes from the address (i18n/marketing.ts).
export async function generateMetadata(): Promise<Metadata> {
  const locale = pageLocale(await getLocale());
  return { title: terms[locale].title, alternates: marketingAlternates("/terms", locale) };
}

export default async function TermsPage() {
  return <LegalDocument doc={terms[pageLocale(await getLocale())]} page="/terms" />;
}
