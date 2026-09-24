import type { Viewport } from "next";
import { getPublicProfile } from "@/features/profile/public";
import { defaultLocale, isLocale } from "@/i18n/config";
import { DESIGN_CONTRACT } from "@/lib/design-contract";
import { archivo } from "@/lib/fonts";
import "../../globals.css";

export const viewport: Viewport = { themeColor: "#E9EBEA" };

/**
 * Root layout of the public profile branch. It reads no cookies or headers, so profile pages stay
 * cacheable; the language comes from the profile owner's setting (docs/ARCHITECTURE.md §6).
 */
export default async function ProfileRootLayout({ children, params }: LayoutProps<"/[username]">) {
  const { username } = await params;
  const profile = await getPublicProfile(decodeURIComponent(username).toLowerCase());
  const lang = profile && isLocale(profile.locale) ? profile.locale : defaultLocale;

  return (
    <html lang={lang} className={archivo.variable} data-theme="light">
      <body>
        <template dangerouslySetInnerHTML={{ __html: `<!--${DESIGN_CONTRACT}-->` }} />
        {children}
      </body>
    </html>
  );
}
