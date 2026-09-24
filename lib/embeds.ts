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
