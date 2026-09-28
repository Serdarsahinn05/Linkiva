import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { languageAlternates, MARKETING_PAGES, marketingUrl } from "@/i18n/marketing";
import { db } from "@/lib/db";
import { profileUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await db.profile.findMany({
    // A profile on its own verified domain is not listed here: its canonical address is on another host.
    where: { isPublished: true, OR: [{ customDomain: null }, { customDomain: { verifiedAt: null } }] },
    select: { username: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 49_000, // sitemap protocol limit is 50,000, the site pages come first
  });
  // Every site page in both languages, each pointing at its translation (hreflang).
  const site: MetadataRoute.Sitemap = MARKETING_PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: marketingUrl(page, locale),
      changeFrequency: page === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: page === "/" ? 1 : 0.3,
      alternates: { languages: languageAlternates(page) },
    })),
  );
  return [...site, ...profiles.map((p) => ({ url: profileUrl(p.username), lastModified: p.updatedAt }))];
}
