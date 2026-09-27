import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { profileLabels } from "@/components/blocks/labels";
import { ProfileView } from "@/components/blocks/profile-view";
import { ViewBeacon } from "@/components/blocks/view-beacon";
import { withLatestVideos } from "@/features/profile/latest-video";
import { getPublicProfile, getUsernameRedirect } from "@/features/profile/public";
import { liveBlocks } from "@/lib/schedule";
import { defaultLocale, isLocale } from "@/i18n/config";
import { profileDisplayUrl, profileUrl, site } from "@/lib/site";

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
  const title = profile.seoTitle || `${name} (@${profile.username}) · ${site.name}`;
  const description = profile.seoDescription || profile.bio || `${name} · ${profileDisplayUrl(profile.username, profile.customDomain)}`;
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    alternates: { canonical: profileUrl(profile.username, profile.customDomain) },
    openGraph: { title, description, url: profileUrl(profile.username, profile.customDomain), siteName: site.name, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProfilePage({ params }: PageProps<"/[username]">) {
  const profile = await load(params);
  if (!profile) {
    // A renamed profile keeps its old address working for 90 days (docs/ARCHITECTURE.md §6).
    const moved = await getUsernameRedirect(decodeURIComponent((await params).username).toLowerCase());
    if (moved) permanentRedirect(`/${moved}`);
    notFound();
  }

  const locale = isLocale(profile.locale) ? profile.locale : defaultLocale;
  const t = await getTranslations({ locale });

  return (
    // A flex column, so the profile scene (flex-1) reaches the bottom of a tall screen: min-height: 100% does not
    // resolve against a parent that only has a min-height.
    <main className="flex min-h-dvh flex-col">
      <ViewBeacon profileId={profile.id} />
      <ProfileView profile={{ ...profile, blocks: await withLatestVideos(liveBlocks(profile.blocks), profile.username) }} labels={profileLabels(t)} />
    </main>
  );
}
