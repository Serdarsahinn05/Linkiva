import { z } from "zod";
import type { SocialPlatform } from "@/prisma/generated/enums";
import { parseEmbed } from "@/lib/embeds";
import { TITLE_MAX } from "@/lib/validation/blocks";
import { displayHost, normalizeUrl } from "@/lib/validation/url";
import type { ImportedItem, ImportedPage } from "./types";

// Only the fields we use; anything else on the page is ignored. Shape as served by linktr.ee (checked 2026-09-27).
const pagePropsSchema = z.object({
  pageTitle: z.string().nullish(),
  description: z.string().nullish(),
  links: z
    .array(z.object({ type: z.string().nullish(), title: z.string().nullish(), url: z.string().nullish(), position: z.number().nullish() }))
    .default([]),
  socialLinks: z.array(z.object({ type: z.string().nullish(), url: z.string().nullish() })).default([]),
});

// Linktree link types that are a video or music player; the rest become plain links.
const PLAYER_TYPES = /VIDEO|MUSIC|SPOTIFY|SOUNDCLOUD|YOUTUBE/;

const SOCIALS: Record<string, SocialPlatform> = {
  INSTAGRAM: "INSTAGRAM",
  TWITTER: "X",
  X: "X",
  TIKTOK: "TIKTOK",
  YOUTUBE: "YOUTUBE",
  GITHUB: "GITHUB",
  LINKEDIN: "LINKEDIN",
  TWITCH: "TWITCH",
  BEHANCE: "BEHANCE",
  DRIBBBLE: "DRIBBBLE",
  SPOTIFY: "SPOTIFY",
  DISCORD: "DISCORD",
  EMAIL_ADDRESS: "EMAIL",
  EMAIL: "EMAIL",
  WEBSITE: "WEBSITE",
};

const clip = (text: string, max: number) => text.trim().replace(/\s+/g, " ").slice(0, max);

/** Reads a public linktr.ee page. null when the page carries no profile data (layout changed, private page…). */
export function parseLinktree(html: string): ImportedPage | null {
  const json = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const parsed = pagePropsSchema.safeParse((raw as { props?: { pageProps?: unknown } } | null)?.props?.pageProps);
  if (!parsed.success) return null;
  const page = parsed.data;

  const items: ImportedItem[] = [];
  for (const link of [...page.links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    const title = clip(link.title ?? "", TITLE_MAX);
    if (link.type === "HEADER") {
      if (title) items.push({ kind: "HEADER", text: title });
      continue;
    }
    const url = link.url ? normalizeUrl(link.url) : null;
    if (!url) continue; // Commerce, forms and locked items carry no plain address.
    if (PLAYER_TYPES.test(link.type ?? "") && parseEmbed(url)) items.push({ kind: "EMBED", url });
    else items.push({ kind: "LINK", title: title || displayHost(url), url });
  }

  const socials: ImportedPage["socials"] = [];
  for (const social of page.socialLinks) {
    const platform = SOCIALS[social.type ?? ""];
    if (platform && social.url && !socials.some((s) => s.platform === platform)) socials.push({ platform, value: social.url });
  }

  return {
    displayName: page.pageTitle ? clip(page.pageTitle, 60) : undefined,
    bio: page.description ? clip(page.description, 160) : undefined,
    items: items.slice(0, 100),
    socials,
  };
}
