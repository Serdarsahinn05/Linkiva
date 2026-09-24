import type { Viewport } from "next";
import { getPublicProfile } from "@/features/profile/public";
import { defaultLocale, isLocale } from "@/i18n/config";
import { DESIGN_CONTRACT } from "@/lib/design-contract";
import { Ambient, LiquidFilter } from "@/components/ui/surface";
import { Specular } from "@/components/ui/specular";
import { fontVariables } from "@/lib/fonts";
import "../../globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D12" },
  ],
};

/**
 * Root layout of the public profile branch. It reads no cookies or headers, so profile pages stay
 * cacheable; the language comes from the profile owner's setting (docs/ARCHITECTURE.md §6).
 */
export default async function ProfileRootLayout({ children, params }: LayoutProps<"/[username]">) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  const lang = profile && isLocale(profile.locale) ? profile.locale : defaultLocale;

  return (
    <html lang={lang} className={fontVariables}>
      <body>
        <template dangerouslySetInnerHTML={{ __html: `<!--${DESIGN_CONTRACT}-->` }} />
        <Ambient />
        <LiquidFilter />
        <Specular />
        {children}
      </body>
    </html>
  );
}
