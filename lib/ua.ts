import type { Device } from "@/prisma/generated/enums";

export type UaInfo = { device: Device; os: string; browser: string };

/**
 * Coarse User-Agent parsing, deliberately small (no dependency): device class, OS family and browser
 * family are all the analytics page shows. In-app browsers are named because that is where bio links live.
 */
export function parseUserAgent(ua: string): UaInfo {
  const s = ua.toLowerCase();

  const device: Device = /ipad|tablet|(android(?!.*mobile))/.test(s) ? "TABLET" : /mobi|iphone|ipod|android/.test(s) ? "MOBILE" : "DESKTOP";

  const os = /iphone|ipad|ipod/.test(s)
    ? "iOS"
    : /android/.test(s)
      ? "Android"
      : /windows/.test(s)
        ? "Windows"
        : /mac os x|macintosh/.test(s)
          ? "macOS"
          : /cros/.test(s)
            ? "ChromeOS"
            : /linux/.test(s)
              ? "Linux"
              : "Other";

  const browser = /instagram/.test(s)
    ? "Instagram"
    : /fban|fbav|fb_iab/.test(s)
      ? "Facebook"
      : /tiktok|bytedance|musical_ly/.test(s)
        ? "TikTok"
        : /twitter/.test(s)
          ? "X"
          : /linkedinapp/.test(s)
            ? "LinkedIn"
            : /edg\//.test(s)
              ? "Edge"
              : /opr\/|opera/.test(s)
                ? "Opera"
                : /samsungbrowser/.test(s)
                  ? "Samsung Internet"
                  : /firefox|fxios/.test(s)
                    ? "Firefox"
                    : /chrome|crios/.test(s)
                      ? "Chrome"
                      : /safari/.test(s)
                        ? "Safari"
                        : "Other";

  return { device, os, browser };
}
