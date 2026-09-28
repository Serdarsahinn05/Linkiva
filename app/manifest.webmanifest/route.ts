import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import tr from "@/messages/tr.json";

/**
 * The installable app (ROADMAP Faz 13, PWA): the dashboard on the home screen, no offline cache (no service worker).
 * A route handler rather than app/manifest.ts, which Next would link from every page: only the site's own pages link
 * it (app/(site)/layout.tsx), so adding a creator's profile to a home screen keeps opening that profile.
 * One language: a manifest is fetched without the visitor's cookie, and Turkish is the site's default.
 */
export const dynamic = "force-static";

export function GET() {
  const manifest: MetadataRoute.Manifest = {
    id: "/dashboard",
    name: site.name,
    short_name: site.name,
    description: tr.meta.description,
    lang: "tr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    // The dark ground of the theme (the same values as the viewport's theme color).
    background_color: "#0B0D12",
    theme_color: "#0B0D12",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: tr.nav.links, url: "/dashboard" },
      { name: tr.nav.analytics, url: "/dashboard/analytics" },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json" } });
}
