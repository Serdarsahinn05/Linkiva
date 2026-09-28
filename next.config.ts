import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Site pages that must never be framed (clickjacking: the panel has one-click actions). Profiles stay frameable: the
 * dashboard previews them in an iframe and owners may embed them elsewhere. The landing page (/) is left out because a
 * custom domain serves its profile at / and headers match the incoming path, before the proxy rewrites it.
 */
const NO_FRAME = ["dashboard", "login", "register", "onboarding", "forgot-password", "reset-password", "check-email", "unsubscribe"];

const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    ...[...NO_FRAME.map((page) => `/${page}/:path*`), "/l/:blockId/gate"].map((source) => ({
      source,
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      ],
    })),
  ],
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
