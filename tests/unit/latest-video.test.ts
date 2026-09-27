import { describe, expect, it } from "vitest";
import { channelIdFromHtml, latestVideoFromFeed, youtubeChannel } from "@/lib/embeds";
import { parseBlock } from "@/lib/validation/blocks";

const ID = "UCBR8-60-B28hp2BmDPdntcQ";

describe("latest video of a YouTube channel (ROADMAP Faz 10)", () => {
  it("recognises channel addresses, not videos or other hosts", () => {
    expect(youtubeChannel("youtube.com/@linkiva")).toEqual({ url: "https://www.youtube.com/@linkiva" });
    expect(youtubeChannel(`https://m.youtube.com/channel/${ID}/videos`)).toEqual({ url: `https://www.youtube.com/channel/${ID}`, channelId: ID });
    expect(youtubeChannel("https://www.youtube.com/c/Linkiva")).toEqual({ url: "https://www.youtube.com/c/Linkiva" });
    expect(youtubeChannel("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeChannel("https://www.youtube.com/channel/not-an-id")).toBeNull();
    expect(youtubeChannel("https://evil.example/@linkiva")).toBeNull();
  });

  it("reads the channel id from a channel page and the newest video from a feed", () => {
    expect(channelIdFromHtml(`<head><link rel="canonical" href="https://www.youtube.com/channel/${ID}"></head>`)).toBe(ID);
    expect(channelIdFromHtml(`{"metadata":{"externalId":"${ID}"}}`)).toBe(ID);
    expect(channelIdFromHtml("<html>consent</html>")).toBeNull();
    const feed = `<feed><entry><yt:videoId>dQw4w9WgXcQ</yt:videoId></entry><entry><yt:videoId>aaaaaaaaaaa</yt:videoId></entry></feed>`;
    expect(latestVideoFromFeed(feed)).toBe("dQw4w9WgXcQ");
    expect(latestVideoFromFeed("<feed></feed>")).toBeNull();
  });

  it("an embed follows a channel only with a valid channel id", () => {
    expect(parseBlock("EMBED", { url: "https://www.youtube.com/@linkiva", latest: "1", channelId: ID })).not.toBeNull();
    expect(parseBlock("EMBED", { url: "https://www.youtube.com/@linkiva", latest: "1", channelId: "UCnope" })).toBeNull();
    expect(parseBlock("EMBED", { url: "https://www.youtube.com/@linkiva" })).toBeNull();
    expect(parseBlock("EMBED", { url: "https://youtu.be/dQw4w9WgXcQ" })).not.toBeNull();
  });
});
