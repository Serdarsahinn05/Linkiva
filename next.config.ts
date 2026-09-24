import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Two root layouts ((site) and (profile)): unmatched URLs need their own full-document 404.
  experimental: { globalNotFound: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default withNextIntl(nextConfig);
