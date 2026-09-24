import { describe, expect, it } from "vitest";
import { isBot, isPrefetch } from "@/lib/bots";
import { geoFromHeaders, referrerHost, utmSource, visitorHash } from "@/lib/tracking";
import { parseUserAgent } from "@/lib/ua";

const IPHONE_IG = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0";
const WIN_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("isBot", () => {
  it.each([
    "WhatsApp/2.23.20.0",
    "TelegramBot (like TwitterBot)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
    "curl/8.4.0",
    "",
  ])("flags %s", (ua) => expect(isBot(ua)).toBe(true));

  it.each([IPHONE_IG, WIN_CHROME, ANDROID, IPAD])("lets real browsers through", (ua) => expect(isBot(ua)).toBe(false));

  it("detects prefetches", () => {
    expect(isPrefetch(new Headers({ "sec-purpose": "prefetch;prerender" }))).toBe(true);
    expect(isPrefetch(new Headers({ "next-router-prefetch": "1" }))).toBe(true);
    expect(isPrefetch(new Headers())).toBe(false);
  });
});

describe("parseUserAgent", () => {
  it.each([
    [IPHONE_IG, { device: "MOBILE", os: "iOS", browser: "Instagram" }],
    [WIN_CHROME, { device: "DESKTOP", os: "Windows", browser: "Chrome" }],
    [ANDROID, { device: "MOBILE", os: "Android", browser: "Chrome" }],
    [IPAD, { device: "TABLET", os: "iOS", browser: "Safari" }],
  ])("%s", (ua, expected) => expect(parseUserAgent(ua)).toEqual(expected));
});

describe("visitorHash", () => {
  const base = { ip: "203.0.113.9", userAgent: WIN_CHROME, profileId: "p1", secret: "s".repeat(32) };
  it("is stable within a day and changes across days and profiles", () => {
    const a = visitorHash({ ...base, date: new Date("2026-09-24T08:00:00Z") });
    expect(visitorHash({ ...base, date: new Date("2026-09-24T20:00:00Z") })).toBe(a);
    expect(visitorHash({ ...base, date: new Date("2026-09-25T08:00:00Z") })).not.toBe(a);
    expect(visitorHash({ ...base, profileId: "p2", date: new Date("2026-09-24T08:00:00Z") })).not.toBe(a);
  });
  it("never contains the IP", () => {
    expect(visitorHash(base)).not.toContain("203");
  });
});

describe("referrerHost / utm / geo", () => {
  it("keeps only the host, normalises short links, drops self-referrals", () => {
    expect(referrerHost("https://l.instagram.com/?u=https%3A%2F%2Flinkiva.space", "linkiva.space")).toBe("instagram.com");
    expect(referrerHost("https://t.co/abc", "linkiva.space")).toBe("x.com");
    expect(referrerHost("https://linkiva.space/serdar", "linkiva.space")).toBeNull();
    expect(referrerHost("not a url", "linkiva.space")).toBeNull();
  });
  it("cleans utm_source", () => {
    expect(utmSource(" Instagram ")).toBe("instagram");
    expect(utmSource("<script>")).toBeNull();
  });
  it("reads geo headers and never invents a location (v1 bug A10)", () => {
    expect(geoFromHeaders(new Headers({ "x-vercel-ip-country": "TR", "x-vercel-ip-city": "%C4%B0stanbul" }))).toEqual({ country: "TR", city: "İstanbul" });
    expect(geoFromHeaders(new Headers())).toEqual({ country: null, city: null });
  });
});
