import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { profileUrl, site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await db.profile.findMany({
    where: { isPublished: true },
    select: { username: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 50_000, // sitemap protocol limit
  });
  return [{ url: site.url, changeFrequency: "weekly", priority: 1 }, ...profiles.map((p) => ({ url: profileUrl(p.username), lastModified: p.updatedAt }))];
}
