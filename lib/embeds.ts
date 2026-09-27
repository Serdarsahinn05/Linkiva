export type Embed =
  | { provider: "youtube"; id: string; src: string; thumbnail: string; aspect: "16/9" }
  | { provider: "spotify"; kind: string; id: string; src: string; height: number }
  | { provider: "soundcloud"; src: string; height: number };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_KINDS = new Set(["track", "album", "playlist", "episode", "show", "artist"]);

/**
 * Turns a pasted YouTube / Spotify / SoundCloud URL into a safe embed description, or null.
 * Only known hosts are accepted and the iframe src is always rebuilt from parsed ids, never taken from input.
 */
export function parseEmbed(input: string): Embed | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");

  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const id =
      host === "youtu.be"
        ? segments[0]
        : url.searchParams.get("v") ?? (["embed", "shorts", "live"].includes(segments[0] ?? "") ? segments[1] : undefined);
    if (!id || !YT_ID.test(id)) return null;
    // Privacy-enhanced mode: no cookies until the visitor plays.
    return { provider: "youtube", id, src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, aspect: "16/9" };
  }

  if (host === "open.spotify.com") {
    const segments = url.pathname.split("/").filter((s) => s && !s.startsWith("intl-"));
    const [kind, id] = segments[0] === "embed" ? segments.slice(1) : segments;
    if (!kind || !id || !SPOTIFY_KINDS.has(kind) || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
    return { provider: "spotify", kind, id, src: `https://open.spotify.com/embed/${kind}/${id}`, height: kind === "track" || kind === "episode" ? 152 : 352 };
  }

  if (host === "soundcloud.com" && url.pathname.split("/").filter(Boolean).length >= 1) {
    const clean = `https://soundcloud.com${url.pathname}`;
    return { provider: "soundcloud", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&visual=false&show_comments=false`, height: 166 };
  }

  return null;
}

// ─── "Latest video" of a YouTube channel (ROADMAP Faz 10) ─────────────────────

export const YT_CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
export const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com"];

/**
 * A YouTube channel address (youtube.com/@name, /channel/UC…, /c/…, /user/…), normalised to https://www.youtube.com/…,
 * with its channel id when the address already carries it. null for anything else, videos included.
 */
export function youtubeChannel(input: string): { url: string; channelId?: string } | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.includes(url.hostname.toLowerCase())) return null;
  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (!first) return null;
  if (first === "channel") return second && YT_CHANNEL_ID.test(second) ? { url: `https://www.youtube.com/channel/${second}`, channelId: second } : null;
  if (/^@[\w.-]{3,30}$/.test(first)) return { url: `https://www.youtube.com/${first}` };
  if ((first === "c" || first === "user") && second && /^[\w.-]{1,100}$/.test(second)) return { url: `https://www.youtube.com/${first}/${second}` };
  return null;
}

/** The channel id on a channel page: its canonical link, or the ids YouTube embeds in the page data. */
export function channelIdFromHtml(html: string): string | null {
  const match =
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/) ??
    html.match(/<meta itemprop="identifier" content="(UC[A-Za-z0-9_-]{22})"/) ??
    html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/);
  return match?.[1] ?? null;
}

/** The newest video id in a channel's Atom feed. */
export function latestVideoFromFeed(xml: string): string | null {
  return xml.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/)?.[1] ?? null;
}

export const channelFeedUrl = (channelId: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
