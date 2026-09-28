import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { terms } from "@/features/legal/terms";

const docFor = async () => terms[(await getLocale()) === "en" ? "en" : "tr"];

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await docFor()).title };
}

export default async function TermsPage() {
  return <LegalDocument doc={await docFor()} />;
}
