import { channelFeedUrl, latestVideoFromFeed } from "@/lib/embeds";
import { profileTag, type PublicBlock } from "./public";

/**
 * The newest video of a channel, from its public Atom feed. The address is built from a validated channel id on a
 * fixed host, so it needs no SSRF guard. `cache` false skips the data cache (the editor checking a channel once).
 */
export async function fetchLatestVideo(channelId: string, cache: { tag: string } | false): Promise<string | null> {
  try {
    const res = await fetch(channelFeedUrl(channelId), {
      signal: AbortSignal.timeout(4000),
      ...(cache ? { next: { revalidate: 3600, tags: [cache.tag] } } : { cache: "no-store" as const }),
    });
    return res.ok ? latestVideoFromFeed(await res.text()) : null;
  } catch {
    return null;
  }
}

/**
 * "Latest video" embeds get the channel's newest video as their address (re-read at most hourly, and on every edit
 * through the profile tag). One whose feed cannot be read is left out: no stale video is made up.
 */
export async function withLatestVideos(blocks: PublicBlock[], username: string): Promise<PublicBlock[]> {
  const resolved = await Promise.all(
    blocks.map(async (block) => {
      const data = (block.data ?? {}) as { latest?: string; channelId?: string };
      if (block.type !== "EMBED" || data.latest !== "1" || !data.channelId) return block;
      const video = await fetchLatestVideo(data.channelId, { tag: profileTag(username) });
      return video ? { ...block, data: { ...data, latest: "", url: `https://www.youtube.com/watch?v=${video}` } } : null;
    }),
  );
  return resolved.filter((block): block is PublicBlock => block !== null);
}
