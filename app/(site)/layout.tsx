import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { archivo } from "@/lib/fonts";
import { DESIGN_CONTRACT } from "@/lib/design-contract";
import { site } from "@/lib/site";
import { parseThemePreference, THEME_COOKIE } from "@/lib/theme-preference";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    openGraph: { siteName: site.name, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E9EBEA" },
    { media: "(prefers-color-scheme: dark)", color: "#111312" },
  ],
};

export default async function SiteRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} data-theme={theme === "system" ? undefined : theme} className={archivo.variable}>
      <body>
        <template dangerouslySetInnerHTML={{ __html: `<!--${DESIGN_CONTRACT}-->` }} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
