import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Ambient, LiquidFilter } from "@/components/ui/surface";
import { Specular } from "@/components/ui/specular";
import { fontVariables } from "@/lib/fonts";
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
    { media: "(prefers-color-scheme: light)", color: "#F4F4F8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D12" },
  ],
};

export default async function SiteRootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} data-theme={theme === "system" ? undefined : theme} className={fontVariables}>
      <body>
        <template dangerouslySetInnerHTML={{ __html: `<!--${DESIGN_CONTRACT}-->` }} />
        <Ambient />
        <LiquidFilter />
        <Specular />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
