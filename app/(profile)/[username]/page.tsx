import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileView } from "@/components/blocks/profile-view";
import { getPublicProfile, liveBlocks } from "@/features/profile/public";
import { defaultLocale, isLocale } from "@/i18n/config";
import { profileUrl, site } from "@/lib/site";

// Data is cached by tag and refreshed on every edit; this bounds how late a scheduled block appears.
export const revalidate = 300;

// No pages at build time; each profile is rendered on first visit, then served from cache (ISR).
export async function generateStaticParams() {
  return [];
}

async function load(params: PageProps<"/[username]">["params"]) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  return profile?.isPublished ? profile : null;
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const profile = await load(params);
  if (!profile) return { title: site.name, robots: { index: false } };
  const name = profile.displayName || profile.username;
  const title = `${name} (@${profile.username}) · ${site.name}`;
  const description = profile.bio ?? `${name} · ${site.host}/${profile.username}`;
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    alternates: { canonical: profileUrl(profile.username) },
    openGraph: { title, description, url: profileUrl(profile.username), siteName: site.name, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[username]">) {
  const profile = await load(params);
  if (!profile) notFound();

  const locale = isLocale(profile.locale) ? profile.locale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "profile" });

  return (
    <main className="min-h-dvh">
      <ProfileView profile={{ ...profile, blocks: liveBlocks(profile.blocks) }} labels={{ madeWith: t("madeWith") }} />
    </main>
  );
}
