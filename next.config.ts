import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Two root layouts ((site) and (profile)): unmatched URLs need their own full-document 404.
  experimental: {
    globalNotFound: true,
    // Dashboard pages are dynamic; keep a visited one for 30 s so switching tabs back and forth is instant instead of
    // refetching every time. Server actions that change data (updateTag/refresh) clear this cache, so edits show at once.
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default withNextIntl(nextConfig);
